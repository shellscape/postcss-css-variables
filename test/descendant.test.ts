import { fixture, process } from './helpers';

const tests = {
  'should work with css4 descendant selector type "nesting"': 'css4-descendant-selector',
  'should work with descendant selector type "nesting"': 'descendant-selector',
  'should work with direct descendant selector': 'direct-descendant-selector',
  'should work with direct descendant selector where variables are scoped in a descendant selector':
    'direct-descendant-selector-descendant-scope',
  'should work with direct descendant selector where variables are scoped in a direct descendant selector':
    'direct-descendant-selector-direct-descendant-scope'
};

describe('descendant', async () => {
  test.each(Object.entries(tests))('%s', async (_desc, file) => {
    const css = await fixture(`descendant/${file}`);
    const result = await process(css);
    expect(result).toMatchSnapshot();
  });
});
