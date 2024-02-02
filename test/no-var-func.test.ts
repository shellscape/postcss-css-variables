import { fixture, process } from './helpers';

const tests = {
  'should work when there are no var() functions to consume declarations': 'no-var-func',
  'should work when there are no var() functions(just `:root`) to consume declarations':
    'no-var-func-just-root'
};

describe('no-var-func', async () => {
  test.each(Object.entries(tests))('%s', async (_desc, file) => {
    const css = await fixture(`no-var-func/${file}`);
    const result = await process(css);
    expect(result).toMatchSnapshot();
  });
});
