import { fixture, process } from './helpers';

const tests = {
  'should work with circular reference': 'circular-reference',
  'should work with variables that try to self reference': 'self-reference',
  'should work with variables that try to self reference and fallback properly':
    'self-reference-fallback'
};

describe('self-ref', async () => {
  test.each(Object.entries(tests))('%s', async (_desc, file) => {
    const css = await fixture(`self-ref/${file}`);
    const result = await process(css);
    expect(result).toMatchSnapshot();
  });
});
