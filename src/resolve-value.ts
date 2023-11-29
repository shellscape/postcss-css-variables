/* eslint-disable consistent-return, no-cond-assign */
import balanced from 'balanced-match';

import { generateScopeList } from './generate-scope-list';
import { isNodeUnderScope } from './is-node-under-scope';
import { gatherVariableDependencies } from './gather-variable-dependencies';

import { findNodeAncestorWithSelector } from './find-node-ancestor-with-selector';
import { cloneSpliceParentOntoNodeWhen } from './clone-splice-parent-onto-node-when';

// Regexp to capture variable names
const RE_VAR_FUNC = /var\(\s*(--[^,\s)]+)/;

function toString(value: any) {
  return String(value);
}

// Check for balanced `var(` and `)` pairs inside `value`, and return the 3 fragments:
// `body` (inside), `pre` (before), `post` (after) of the found wrapper
function balancedVar(value: any): any {
  const match = balanced('(', ')', value);
  if (match) {
    // Check if it was prepended with var
    if (/(?:^|[^\w-])var$/.test(match.pre)) {
      // Remove the const from the end of pre
      return {
        body: match.body,
        post: match.post,
        pre: match.pre.slice(0, -3)
      };
    }
    // Check inside body
    const bodyMatch = balancedVar(match.body);
    if (bodyMatch) {
      // Reconstruct pre and post
      return {
        body: bodyMatch.body,
        post: `${bodyMatch.post})${match.post}`,
        pre: `${match.pre}(${bodyMatch.pre}`
      };
    }
    // Check inside post
    const postMatch = balancedVar(match.post);
    if (postMatch) {
      // Reconstruct pre
      return {
        body: postMatch.body,
        post: postMatch.post,
        pre: `${match.pre}(${match.body})${postMatch.pre}`
      };
    }
  }
}

// Pass in a value string to parse/resolve and a map of available values
// and we can figure out the final value
//
// `ignorePseudoScope`: Optional bool to determine whether the scope resolution should be left alone or not
//
// Note: We do not modify the declaration
// Note: Resolving a declaration value without any `var(...)` does not harm the final value.
//		This means, feel free to run everything through this function
export const resolveValue = function (
  decl: any,
  map: any,
  ignorePseudoScope?: any,
  _debugIsInternal?: any
) {
  let matchingVarDecl;
  let resultantValue = toString(decl.value);
  const warnings = [];

  // Match all variables first so we can later on if there are circular dependencies
  const variablesUsedInValueMap: Record<string, any> = {};
  // Create a temporary variable, storing resultantValue variable value
  let remainingVariableValue: string | undefined = resultantValue;
  // Use balanced lib to find var() declarations and store variable names
  while ((matchingVarDecl = balancedVar(remainingVariableValue))) {
    // Split at the comma to find variable name and fallback value
    // There may be other commas in the values so this isn't necessarily just 2 pieces
    const variableFallbackSplitPieces = matchingVarDecl.body.split(',');

    // Get variable name and fallback, filtering empty items
    const variableName = variableFallbackSplitPieces[0].trim();

    // add variable found in the object
    variablesUsedInValueMap[variableName] = true;

    // Replace variable name (first occurence only) from result, to avoid circular loop
    remainingVariableValue =
      (matchingVarDecl.pre || '') +
      matchingVarDecl.body.replace(variableName, '') +
      (matchingVarDecl.post || '');
  }
  // clear temporary variable
  remainingVariableValue = undefined;

  const variablesUsedInValue = Object.keys(variablesUsedInValueMap);

  // console.log(debugIndent, (_debugIsInternal ? '' : 'Try resolving'), generateScopeList(decl.parent, true), `ignorePseudoScope=${ignorePseudoScope}`, '------------------------');

  // Resolve any var(...) substitutons
  let isResultantValueUndefined = false;

  // var() = var( <custom-property-name> [, <any-value> ]? )
  // matches `name[, fallback]`, captures "name" and "fallback"
  // See: http://dev.w3.org/csswg/css-variables/#funcdef-var
  while ((matchingVarDecl = balancedVar(resultantValue))) {
    let matchingVarDeclMapItem: any;

    // Split at the comma to find variable name and fallback value
    // There may be other commas in the values so this isn't necessarily just 2 pieces
    const variableFallbackSplitPieces = matchingVarDecl.body.split(',');

    // Get variable name and fallback, filtering empty items
    const variableName = variableFallbackSplitPieces[0].trim();
    const fallback =
      variableFallbackSplitPieces.length > 1
        ? variableFallbackSplitPieces.slice(1).join(',').trim()
        : undefined;

    (map[variableName] || []).forEach((varDeclMapItem: any) => {
      // Make sure the variable declaration came from the right spot
      // And if the current matching variable is already important, a new one to replace it has to be important
      // const isRoot =
      //   varDeclMapItem.parent.type === 'root' || varDeclMapItem.parent.selectors[0] === ':root';

      // const underScope = isNodeUnderScope(decl.parent, varDeclMapItem.parent);
      const underScsopeIgnorePseudo = isNodeUnderScope(
        decl.parent,
        varDeclMapItem.parent,
        ignorePseudoScope
      );

      // console.log(debugIndent, 'isNodeUnderScope', underScope, underScsopeIgnorePseudo, generateScopeList(varDeclMapItem.parent, true), varDeclMapItem.decl.value);

      if (
        underScsopeIgnorePseudo &&
        // And if the currently matched declaration is `!important`, it will take another `!important` to override it
        (!(matchingVarDeclMapItem || {}).isImportant || varDeclMapItem.isImportant)
      ) {
        matchingVarDeclMapItem = varDeclMapItem;
      }
    });

    // Default to the calculatedInPlaceValue which might be a previous fallback, then try this declarations fallback
    let replaceValue =
      (matchingVarDeclMapItem || {}).calculatedInPlaceValue ||
      (function () {
        // Resolve `var` values in fallback
        let fallbackValue = fallback;
        if (fallback) {
          const fallbackDecl = decl.clone({ parent: decl.parent, value: fallback });
          fallbackValue = resolveValue(fallbackDecl, map, false, /* internal*/ true).value;
        }

        return fallbackValue;
      })();
    // Otherwise if the dependency health is good(no circular or self references), dive deeper and resolve
    if (
      matchingVarDeclMapItem !== undefined &&
      !gatherVariableDependencies(variablesUsedInValue, map).hasCircularOrSelfReference
    ) {
      // Splice the declaration parent onto the matching entry

      const varDeclScopeList = generateScopeList(decl.parent.parent, true);
      const innerMostAtRuleSelector = varDeclScopeList[0].slice(-1)[0];
      const nodeToSpliceParentOnto = findNodeAncestorWithSelector(
        innerMostAtRuleSelector,
        matchingVarDeclMapItem.decl.parent
      );
      // See: `test/fixtures/cascade-with-calc-expression-on-nested-rules`
      const matchingMimicDecl = cloneSpliceParentOntoNodeWhen(
        matchingVarDeclMapItem.decl,
        decl.parent.parent,
        (ancestor: any) => ancestor === nodeToSpliceParentOnto
      );

      replaceValue = resolveValue(matchingMimicDecl, map, false, /* internal*/ true).value;
    }

    isResultantValueUndefined = replaceValue === undefined;
    if (isResultantValueUndefined) {
      warnings.push([
        `variable ${variableName} is undefined and used without a fallback`,
        { node: decl }
      ]);
    }

    // Replace original declaration with found value
    resultantValue = (matchingVarDecl.pre || '') + replaceValue + (matchingVarDecl.post || '');
  }

  return {
    // The resolved value
    value: !isResultantValueUndefined ? resultantValue : undefined,
    // Array of variable names used in resolving this value
    variablesUsed: variablesUsedInValue,
    // Any warnings generated from parsing this value
    warnings
  };
};

resolveValue.RE_VAR_FUNC = RE_VAR_FUNC;
