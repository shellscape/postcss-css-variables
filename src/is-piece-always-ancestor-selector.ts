const alwaysAncestorSelector = {
  '*': true,
  ':root': true,
  html: true
} as const;

// This means it will be always be an ancestor of any other selector
export const isPieceAlwaysAncestorSelector = function (piece: keyof typeof alwaysAncestorSelector) {
  return !!alwaysAncestorSelector[piece];
};
