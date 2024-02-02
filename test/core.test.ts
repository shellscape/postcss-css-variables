import { fixture, process } from './helpers';

const tests = {
  'accept whitespace in var() declarations': 'whitespace-in-var-declaration',
  'replace in scoped blocks': 'background-url',
  'work when no variable name passed to `var()`': 'empty-var-func',
  'work with `!important` variable declarations': 'important-variable-declaration',
  'work with any combinator selector if the last piece is the variable we have in the map':
    'scope-last-piece-of-combinator-sequence',
  'work with locally scoped variable in a non-root rule': 'local-variable-non-root',
  'work with star selector': 'star-selector-scope',
  'work with variables declared in root': 'root-variable',
  'work with variables with parenthesis in fallback': 'fallback-with-parenthesis'
};

describe('core', async () => {
  test.each(Object.entries(tests))('%s', async (_desc, file) => {
    const css = await fixture(`core/${file}`);
    const result = await process(css);
    expect(result).toMatchSnapshot();
  });

  test('throw on malformed var()', async () => {
    const css = await fixture('core/malformed-variable-usage');
    expect(async () => process(css)).rejects.toThrowErrorMatchingSnapshot();
  });
});
