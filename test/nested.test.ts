import { fixture, process } from './helpers';

const tests = {
  'should not mangle outer function parentheses': 'nested-inside-other-func',
  'should not mangle outer function parentheses - calc': 'nested-inside-calc-func',
  'should not mangle outer function parentheses - calc with fallback':
    'nested-inside-calc-func-with-fallback',
  'should not mangle outer function parentheses - calc with fallback var()':
    'nested-inside-calc-func-with-fallback-var',
  'should not mangle outer function parentheses - with fallback':
    'nested-inside-other-func-with-fallback',
  'should work with nested at-rules containing properties': 'nested-at-rules-containing-properties'
};

describe('nested', async () => {
  test.each(Object.entries(tests))('%s', async (_desc, file) => {
    const css = await fixture(`nested/${file}`);
    const result = await process(css);
    expect(result).toMatchSnapshot();
  });
});
