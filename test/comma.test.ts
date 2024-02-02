import { fixture, process } from './helpers';

const tests = {
  'work use the correct variable in comma separated selector': 'comma-separated-variable-usage',
  'work with variables defined in comma separated selector': 'comma-separated-variable-declaration'
};

describe('comma', async () => {
  test.each(Object.entries(tests))('%s', async (_desc, file) => {
    const css = await fixture(`comma/${file}`);
    const result = await process(css);
    expect(result).toMatchSnapshot();
  });
});
