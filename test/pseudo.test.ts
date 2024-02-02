import { fixture, process } from './helpers';

const tests = {
  'should work with pseudo selectors': 'pseudo-selector',
  'should work with variables declared in pseudo selectors': 'pseudo-selector-declare-variable'
};

describe('pseudo', async () => {
  test.each(Object.entries(tests))('%s', async (_desc, file) => {
    const css = await fixture(`pseudo/${file}`);
    const result = await process(css);
    expect(result).toMatchSnapshot();
  });
});
