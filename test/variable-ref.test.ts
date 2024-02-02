import { fixture, process } from './helpers';

const tests = {
  'should work with local variables that reference other variables with at-rule changing the value':
    'variable-reference-other-variable-media-query2',
  'should work with variable with calc-expression that reference other variables':
    'variable-with-calc-expression-reference-other-variable',
  'should work with variables that reference other variables': 'variable-reference-other-variable',
  'should work with variables that reference other variables with at-rule changing the value':
    'variable-reference-other-variable-media-query1'
};

describe('variable-ref', async () => {
  test.each(Object.entries(tests))('%s', async (_desc, file) => {
    const css = await fixture(`variable-ref/${file}`);
    const result = await process(css);
    expect(result).toMatchSnapshot();
  });
});
