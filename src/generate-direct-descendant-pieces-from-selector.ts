// Unit Tests: https://regex101.com/r/oS4zJ8/3

const RE_SELECTOR_DIRECT_DESCENDANT_SPLIT =
  // eslint-disable-next-line no-useless-escape
  /(.*?(?:(?:\([^\)]+\)|\[[^\]]+\]|(?!>>|<|\+|~|\s).)+)(?:(?:(?:>(?!>))|(?:\s?>(?!>)\s?))(?!\s+))(?!(?:>>|<|\+|~)[\s]+?))/;

export const generateDirectDescendantPiecesFromSelector = function (selector: string) {
  return selector
    .split(RE_SELECTOR_DIRECT_DESCENDANT_SPLIT)
    .filter((piece) => {
      if (piece.length > 0) {
        return true;
      }
      return false;
    })
    .map((piece) =>
      // Trim whitespace which would be a normal descendant selector
      // and trim off the CSS4 descendant `>>` into a normal descendant selector
      piece.trim().replace(/\s*?>\s*?/g, '')
    );
};
