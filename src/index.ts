import extend from 'extend';
import type { Plugin } from 'postcss';

import { shallowCloneNode } from './shallow-clone-node';
import { resolveValue } from './resolve-value';
import { resolveDecl } from './resolve-decl';

// A custom property is any property whose name starts with two dashes (U+002D HYPHEN-MINUS)
// `--foo`
// See: http://dev.w3.org/csswg/css-variables/#custom-property
const RE_VAR_PROP = /(--(.+))/;

function eachCssVariableDeclaration(css: any, cb: any) {
  // Loop through all of the declarations and grab the variables and put them in the map
  css.walkDecls((decl: any) => {
    // If declaration is a variable
    if (RE_VAR_PROP.test(decl.prop)) {
      cb(decl);
    }
  });
}

function cleanUpNode(node: any) {
  // If we removed all of the declarations in the rule(making it empty),
  // then just remove it
  let nodeToPossiblyCleanUp = node;
  while (nodeToPossiblyCleanUp && nodeToPossiblyCleanUp.nodes.length <= 0) {
    const nodeToRemove = nodeToPossiblyCleanUp.type !== 'root' ? nodeToPossiblyCleanUp : null;

    if (nodeToRemove) {
      // Get a reference to it before we remove
      // and lose reference to the child after removing it
      nodeToPossiblyCleanUp = nodeToRemove.parent;

      nodeToRemove.remove();
    } else {
      nodeToPossiblyCleanUp = null;
    }
  }
}

const defaults = {
  // Allows you to preserve custom properties & var() usage in output.
  // `true`, `false`, or `'computed'`
  preserve: false,
  // Will write media queries in the same order as in the original file.
  // Currently defaulted to false for legacy behavior. We can update to `true` in a major version
  preserveAtRulesOrder: false,
  // Preserve variables injected via JS with the `variables` option above
  // before serializing to CSS (`false` will remove these variables from output)
  preserveInjectedVariables: true,
  // Define variables via JS
  // Simple key-value pair
  // or an object with a `value` property and an optional `isImportant` bool property
  variables: {}
};

export const postcssVarReplace = (options = {}): Plugin => {
  const opts = extend({}, defaults, options) as Record<string, any>;

  return {
    Once(css, { decl, result, rule }) {
      // Transform CSS AST here
      // List of nodes that if empty, will be removed
      // We use this because we don't want to modify the AST when we still need to reference these later on
      const nodesToRemoveAtEnd: any[] = [];

      // Keep track of the injected from `opts.variables` to remove at the end
      // if user passes `opts.preserveInjectedVariables = false`
      const injectedDeclsToRemoveAtEnd: any[] = [];

      // Map of variable names to a list of declarations
      let map: any = {};

      // Add the js defined variables `opts.variables` to the map
      map = extend(
        map,
        Object.keys(opts.variables).reduce((prevVariableMap: any, variableName) => {
          const variableEntry = opts.variables[variableName];
          // Automatically prefix any variable with `--` (CSS custom property syntax) if it doesn't have it already
          variableName = variableName.slice(0, 2) === '--' ? variableName : `--${variableName}`;
          const variableValue = (variableEntry || {}).value || variableEntry;
          const isImportant = (variableEntry || {}).isImportant || false;

          // Add a root node to the AST
          const variableRootRule = rule({ selector: ':root' });
          css.root().prepend(variableRootRule);
          // Add the variable decl to the root node
          const varDecl = decl({
            important: isImportant,
            prop: variableName,
            value: variableValue
          });
          variableRootRule.append(varDecl);

          // Collect JS-injected variables for removal if `opts.preserveInjectedVariables = false`
          if (!opts.preserveInjectedVariables) {
            injectedDeclsToRemoveAtEnd.push(varDecl);
          }

          // Add the entry to the map
          prevVariableMap[variableName] = (prevVariableMap[variableName] || []).concat({
            calculatedInPlaceValue: variableValue,
            decl: varDecl,
            isImportant,
            isUnderAtRule: false,
            parent: variableRootRule,
            prop: variableName,
            variablesUsed: []
          });

          return prevVariableMap;
        }, {})
      );

      // Chainable helper function to log any messages (warnings)
      const logResolveValueResult = function (valueResult: any) {
        // Log any warnings that might of popped up
        const warningList: any[] = [].concat(valueResult.warnings);
        warningList.forEach((warningArgs) => {
          warningArgs = [].concat(warningArgs);
          // eslint-disable-next-line prefer-spread
          result.warn.apply(result, warningArgs);
        });

        // Keep the chain going
        return valueResult;
      };

      // Collect all of the variables defined
      // ---------------------------------------------------------
      // ---------------------------------------------------------
      eachCssVariableDeclaration(css, (decl: any) => {
        const declParentRule = decl.parent;

        const valueResults = logResolveValueResult(resolveValue(decl, map));
        // Split out each selector piece into its own declaration for easier logic down the road
        decl.parent.selectors.forEach((selector: any) => {
          // Create a detached clone
          const splitOutRule = shallowCloneNode(decl.parent);
          splitOutRule.selector = selector;
          splitOutRule.parent = decl.parent.parent;

          const declClone = decl.clone();
          splitOutRule.append(declClone);

          const { prop } = decl;
          map[prop] = (map[prop] || []).concat({
            calculatedInPlaceValue: valueResults.value,
            decl: declClone,
            isImportant: decl.important || false,
            // variables inside root or at-rules (eg. @media, @support)
            isUnderAtRule: splitOutRule.parent.type === 'atrule',
            parent: splitOutRule,
            prop,
            variablesUsed: valueResults.variablesUsed
          });
        });

        let preserveDecl;
        if (typeof opts.preserve === 'function') {
          preserveDecl = opts.preserve(decl);
        } else {
          preserveDecl = opts.preserve;
        }
        // Remove the variable declaration because they are pretty much useless after we resolve them
        if (!preserveDecl) {
          decl.remove();
        }
        // Or we can also just show the computed value used for that variable
        else if (preserveDecl === 'computed') {
          decl.value = valueResults.value;
        }

        // We add to the clean up list if we removed some variable declarations to make it become an empty rule
        // We clean up later on because we don't want to modify the AST when we still need to reference these later on
        if (declParentRule.nodes.length <= 0) {
          nodesToRemoveAtEnd.push(declParentRule);
        }
      });

      // Resolve variables everywhere
      // ---------------------------------------------------------
      // ---------------------------------------------------------

      // Collect all the rules that have declarations that use variables
      const rulesThatHaveDeclarationsWithVariablesList: any[] = [];
      css.walk((rule: any) => {
        // We're only interested in Containers with children.
        if (rule.nodes === undefined) return;

        const doesRuleUseVariables = rule.nodes.some((node: any) => {
          if (node.type === 'decl') {
            const decl = node;
            // If it uses variables
            // and is not a variable declarations that we may be preserving from earlier
            if (resolveValue.RE_VAR_FUNC.test(decl.value) && !RE_VAR_PROP.test(decl.prop)) {
              return true;
            }
          }

          return false;
        });

        if (doesRuleUseVariables) {
          if (rule.type === 'rule' && rule.selectors.length > 1) {
            // Split out the rule into each comma separated selector piece
            // We only need to split if it's actually a Rule with multiple selectors (comma separated)
            // duplicate rules would be probably merged with cssnano (cannot be sure about nested)
            rule.selectors.reverse().forEach((selector: string) => {
              const ruleClone = rule.cloneAfter();
              ruleClone.selector = selector;

              return ruleClone;
            });

            // Rules will be added to list in the next traverse
            rule.remove();
          } else {
            rulesThatHaveDeclarationsWithVariablesList.push(rule);
          }
        }
      });

      rulesThatHaveDeclarationsWithVariablesList.forEach((rule) => {
        // Resolve the declarations
        rule.nodes.slice(0).forEach((node: any) => {
          if (node.type === 'decl') {
            const decl = node;
            resolveDecl(decl, map, opts.preserve, opts.preserveAtRulesOrder, logResolveValueResult);
          }
        });
      });

      // Clean up any nodes we don't want anymore
      // We clean up at the end because we don't want to modify the AST when we still need to reference these later on
      nodesToRemoveAtEnd.forEach(cleanUpNode);

      // Clean up JS-injected variables marked for removal
      injectedDeclsToRemoveAtEnd.forEach((injectedDecl) => {
        injectedDecl.remove();
      });
    },
    postcssPlugin: 'postcss-var-replace'
  };
};

postcssVarReplace.postcss = true;
