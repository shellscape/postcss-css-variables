import { generateDescendantPiecesFromSelector } from './generate-descendant-pieces-from-selector';

export const generateScopeList = function (node: any, includeSelf?: any) {
  includeSelf = includeSelf || false;

  let selectorScopeList = [
    // Start off with one branch
    []
  ];
  let currentNodeParent = includeSelf ? node : node.parent;
  while (currentNodeParent) {
    // `currentNodeParent.selectors` is a list of each comma separated piece of the selector
    let scopePieces = (currentNodeParent.selectors || []).map((selectorPiece: any) => {
      return {
        type: 'selector',
        value: selectorPiece
      };
    });

    // If it is a at-rule, then we need to construct the proper piece
    if (currentNodeParent.type === 'atrule') {
      scopePieces = [].concat(currentNodeParent.params).map((param) => {
        return {
          type: 'atrule',
          value: `@${currentNodeParent.name} ${param}`
        };
      });
    }

    // Branch each current scope for each comma separated selector
    // Otherwise just keep the [1] branch going
    const branches = (scopePieces.length > 0 ? scopePieces : [1]).map(() =>
      selectorScopeList.map((scopePieces) => scopePieces.slice(0))
    );

    scopePieces.forEach((scopeObject: any, index: number) => {
      // Update each selector string with the new piece
      branches[index] = branches[index].map((scopeStringPieces: any) => {
        let descendantPieces = [scopeObject.value];
        // Split at any descendant combinators to properly make the scope list
        if (scopeObject.type === 'selector') {
          descendantPieces = generateDescendantPiecesFromSelector(scopeObject.value);
        }

        // Add to the front of the array
        // eslint-disable-next-line prefer-spread
        scopeStringPieces.unshift.apply(scopeStringPieces, descendantPieces);

        return scopeStringPieces;
      });
    });

    // Start from a new list so we can
    // Flatten out the branches a bit and and merge back into the list
    selectorScopeList = [];
    branches.forEach((branch: any) => {
      selectorScopeList = selectorScopeList.concat(branch);
    });

    currentNodeParent = currentNodeParent.parent;
  }

  return selectorScopeList;
};
