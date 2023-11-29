// Unit Tests: https://regex101.com/r/oP0fM9/15
//
// It is a shame the regex has to be this long. Maybe a CSS selector parser would be better.
// We could almost use `/\b\s(?![><+~][\s]+?)/` to split the selector but this doesn't work with attribute selectors
const RE_SELECTOR_DESCENDANT_SPLIT =
  // eslint-disable-next-line no-useless-escape
  /(.*?(?:(?:\([^\)]+\)|\[[^\]]+\]|(?![><+~\s]).)+)(?:(?:(?:\s(?!>>))|(?:\t(?!>>))|(?:\s?>>\s?))(?!\s+))(?![><+~][\s]+?))/;

export const generateDescendantPiecesFromSelector = function (selector: string) {
  return selector
    .split(RE_SELECTOR_DESCENDANT_SPLIT)
    .filter((piece) => {
      if (piece.length > 0) {
        return true;
      }
      return false;
    })
    .map((piece) =>
      // Trim whitespace which would be a normal descendant selector
      // and trim off the CSS4 descendant `>>` into a normal descendant selector
      piece.trim().replace(/\s*?>>\s*?/g, '')
    );
};
