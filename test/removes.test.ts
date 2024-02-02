import { fixture, process } from './helpers';

const tests = {
  'should clean up neseted rules if we removed variable declarations to make it empty':
    'remove-nested-empty-rules-after-variable-collection',
  'should clean up rules if we removed variable declarations to make it empty':
    'remove-empty-rules-after-variable-collection'
};

describe('removes', async () => {
  test.each(Object.entries(tests))('%s', async (_desc, file) => {
    const css = await fixture(`removes/${file}`);
    const result = await process(css);
    expect(result).toMatchSnapshot();
  });
});
