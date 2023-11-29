import escapeStringRegexp from 'escape-string-regexp';

import { isPieceAlwaysAncestorSelector } from './is-piece-always-ancestor-selector';
import { generateDirectDescendantPiecesFromSelector } from './generate-direct-descendant-pieces-from-selector';

const RE_AT_RULE_SCOPE_PIECE = /^@.*/;
// This will match pseudo selectors that have a base part
// ex. .foo:hover
// It will NOT match `:root`
// const RE_PSEUDO_SELECTOR = /([^\s:]+)((?::|::)[^\s]*?)(\s+|$)/;
const RE_PSEUDO_SELECTOR = /([^\s:]+)(?<!\\)((?::|::)[^\s]*?)(\s+|$)/;

function getScopeMatchResults(nodeScopeList: any, scopeNodeScopeList: any) {
  let currentPieceOffset: any;
  let scopePieceIndex: any;

  // Check each comma separated piece of the complex selector
  const doesMatchScope = scopeNodeScopeList.some((scopeNodeScopePieces: any) =>
    nodeScopeList.some((nodeScopePieces: any) => {
      // console.log('sp', scopeNodeScopePieces);
      // console.log('np', nodeScopePieces);

      currentPieceOffset = null;
      let wasEveryPieceFound = true;
      for (scopePieceIndex = 0; scopePieceIndex < scopeNodeScopePieces.length; scopePieceIndex++) {
        const scopePiece = scopeNodeScopePieces[scopePieceIndex];
        const pieceOffset = currentPieceOffset || 0;

        let foundIndex = -1;
        // Look through the remaining pieces(start from the offset)
        const piecesWeCanMatch = nodeScopePieces.slice(pieceOffset);
        for (
          let nodeScopePieceIndex = 0;
          nodeScopePieceIndex < piecesWeCanMatch.length;
          nodeScopePieceIndex++
        ) {
          const nodeScopePiece = piecesWeCanMatch[nodeScopePieceIndex];
          const overallIndex = pieceOffset + nodeScopePieceIndex;

          // Find the scope piece at the end of the node selector
          // Last-occurence
          if (
            // If the part on the end of the piece itself matches:
            //		scopePiece `.bar` matches node `.bar`
            //		scopePiece `.bar` matches node `.foo + .bar`
            new RegExp(`${escapeStringRegexp(scopePiece)}$`).test(nodeScopePiece)
          ) {
            foundIndex = overallIndex;
            break;
          }

          // If the scope piece is a always-ancestor, then it is valid no matter what
          //
          // Or the node scope piece could be an always-ancestor selector itself
          // And we only want the first occurence so we can keep matching future scope pieces
          if (
            isPieceAlwaysAncestorSelector(scopePiece) ||
            isPieceAlwaysAncestorSelector(nodeScopePiece)
          ) {
            foundIndex = overallIndex;

            break;
          }

          // Handle any direct descendant operators in each piece
          const directDescendantPieces: any =
            generateDirectDescendantPiecesFromSelector(nodeScopePiece);
          // Only try to work out direct descendants if there was the `>` combinator, meaning multiple pieces
          if (directDescendantPieces.length > 1) {
            const ddNodeScopeList: any = ([] as any[]).concat([directDescendantPieces]);
            // Massage into a direct descendant separated list
            const ddScopeList: any = ([] as any[]).concat([
              scopeNodeScopePieces
                .slice(scopePieceIndex)
                .reduce(
                  (prevScopePieces: any, scopePiece: any) =>
                    prevScopePieces.concat(generateDirectDescendantPiecesFromSelector(scopePiece)),
                  []
                )
            ]);
            const result = getScopeMatchResults(ddNodeScopeList, ddScopeList);

            // If it matches completely
            // or there are still more pieces to match in the future
            if (result.doesMatchScope || scopePieceIndex + 1 < scopeNodeScopePieces.length) {
              foundIndex = overallIndex;
              // Move the scope forward the amount that piece consumed
              // -1 because the of for-loop increments at each iteration
              scopePieceIndex += result.scopePieceIndex - 1;
            }

            break;
          }
        }

        const isFurther = foundIndex >= pieceOffset;

        currentPieceOffset = foundIndex + 1;

        // Mimicing a `[].every` with a for-loop
        wasEveryPieceFound = wasEveryPieceFound && isFurther;
        if (!wasEveryPieceFound) {
          break;
        }
      }

      return wasEveryPieceFound;
    })
  );

  return {
    doesMatchScope,
    nodeScopePieceIndex: currentPieceOffset ? currentPieceOffset - 1 : 0,
    scopePieceIndex
  };
}

const stripPseudoSelectorsFromScopeList = function (scopeList: any) {
  return scopeList.map((scopePieces: any) =>
    scopePieces.map((descendantPiece: any) => {
      // If not an at-rule piece, remove the pseudo selector part `@media (max-width: 300px)`
      if (!RE_AT_RULE_SCOPE_PIECE.test(descendantPiece)) {
        return descendantPiece.replace(
          new RegExp(RE_PSEUDO_SELECTOR.source, 'g'),
          (_whole: any, baseSelector: any, _pseudo: any, trailingWhitespace: any) =>
            baseSelector + trailingWhitespace
        );
      }
      return descendantPiece;
    })
  );
};

// Given the nodes scope, and the target scope,
// Is the node in the same or under the target scope (cascade wise)
//
// Another way to think about it: Can the target scope cascade properties to the node?
//
// For scope-lists see: `generateScopeList`
export const isUnderScope = function (
  nodeScopeList: any,
  scopeNodeScopeList: any,
  ignorePseudo?: any
) {
  // Because we only care about the scopeNodeScope matching to the nodeScope
  // Remove the pseudo selectors from the nodeScope so it can match a broader version
  // ex. `.foo:hover` can resolve variables from `.foo`
  nodeScopeList = stripPseudoSelectorsFromScopeList(nodeScopeList);

  if (ignorePseudo) {
    scopeNodeScopeList = stripPseudoSelectorsFromScopeList(scopeNodeScopeList);
  }

  return getScopeMatchResults(nodeScopeList, scopeNodeScopeList).doesMatchScope;
};

isUnderScope.RE_PSEUDO_SELECTOR = RE_PSEUDO_SELECTOR;
