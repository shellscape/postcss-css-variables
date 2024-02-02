import { fixture, process } from './helpers';

const tests = {
  'cascade to nested multiple rules': 'multiple-on-nested-rules',
  'cascade to nested rules': 'nested-rules',
  'cascade to nested rules in the proper scope': 'nested-rules-in-proper-scope',
  'cascade with calc-expression to nested rules': 'calc-expression-on-nested-rules'
};

describe('cascading', async () => {
  test.each(Object.entries(tests))('%s', async (_desc, file) => {
    const css = await fixture(`cascade/${file}`);
    const result = await process(css);
    expect(result).toMatchSnapshot();
  });
});
