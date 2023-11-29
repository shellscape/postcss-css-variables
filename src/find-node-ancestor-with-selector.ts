import { generateScopeList } from './generate-scope-list';

// Find a node starting from the given node that matches
// Works on a PostCSS AST tree
export const findNodeAncestorWithSelector = function (selector: string, node: any) {
  let matchingNode;

  // Keep going until we run out of parents to search
  // or we found the node
  let currentNode = node;
  while (currentNode.parent && !matchingNode) {
    // A trick to get the selector split up. Generate a scope list on a clone(clean parent)
    const currentNodeScopeList = generateScopeList(currentNode.clone(), true);

    // eslint-disable-next-line no-loop-func
    currentNodeScopeList.some((scopePieces) =>
      scopePieces.some((scopePiece) => {
        if (scopePiece === selector) {
          matchingNode = currentNode;
          return true;
        }

        return false;
      })
    );

    currentNode = currentNode.parent;
  }

  return matchingNode;
};
