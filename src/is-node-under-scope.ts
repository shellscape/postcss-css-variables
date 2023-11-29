import { isUnderScope } from './is-under-scope';
import { generateScopeList } from './generate-scope-list';

export const isNodeUnderScope = function (node: any, scopeNode: any, ignorePseudo?: any) {
  const nodeScopeList = generateScopeList(node, true);
  const scopeNodeScopeList = generateScopeList(scopeNode, true);

  return isUnderScope(nodeScopeList, scopeNodeScopeList, ignorePseudo);
};
