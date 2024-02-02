import { fixture, process } from './helpers';

const tests = {
  'add rule declaration of property in @support': 'support-directive',
  'work with at-rules containing properties': 'at-rules-containing-properties'
};

describe('at-rules', async () => {
  test.each(Object.entries(tests))('%s', async (_desc, file) => {
    const css = await fixture(`at-rules/${file}`);
    const result = await process(css);
    expect(result).toMatchSnapshot();
  });
});
