import type { Result } from 'postcss';

import { fixture, process } from './helpers';

const tests = {
  'use fallback value if provided with missing variables': 'missing-variable-should-fallback',
  'use fallback variable if provided with missing variables':
    'missing-variable-should-fallback-var',
  'use fallback variable if provided with missing variables calc':
    'missing-variable-should-fallback-calc',
  'use fallback variable if provided with missing variables nested':
    'missing-variable-should-fallback-nested',
  'work with missing variables': 'missing-variable-usage'
};

describe('missing-var', async () => {
  test.each(Object.entries(tests))('%s', async (_desc, file) => {
    const css = await fixture(`missing-var/${file}`);
    const result = await process(css);
    expect(result).toMatchSnapshot();
  });

  test('use string values for `undefined` values, see #22', async () => {
    const css = await fixture('missing-var/missing-variable-usage');
    const result = (await process(css, void 0, true)) as Result;
    const { root } = result;
    const [fooRule] = root.nodes;
    expect((fooRule as any).selector).to.equal('.box-foo');
    const [colorDecl] = (fooRule as any).nodes;
    expect(colorDecl.value).to.be.a('string');
    expect(colorDecl.value).to.be.equal('undefined');

    expect(result.warnings().length).to.be.equal(1);
    expect(result.warnings()[0].type).to.be.equal('warning');
    expect(result.warnings()[0].text).to.be.equal(
      'variable --missing is undefined and used without a fallback'
    );
  });
});
