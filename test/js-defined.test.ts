import { fixture, process } from './helpers';

const variables = {
  '--js-defined-important': {
    isImportant: true,
    value: '#0f0'
  },
  '--js-defined1': '75px',
  '--js-defined2': {
    value: '80px'
  },
  // Should be automatically prefixed with `--`
  'js-defined-no-prefix': '#ff0000'
};

describe('js-defined', async () => {
  test('work with JS defined variables', async () => {
    const css = await fixture('js-defined/js-defined');
    const result = await process(css, { variables });
    expect(result).toMatchSnapshot();
  });

  test('work with JS defined important variables', async () => {
    const css = await fixture('js-defined/js-defined-important');
    const result = await process(css, { variables });
    expect(result).toMatchSnapshot();
  });

  test('preserve -- declarations and var() values with `options.variables` AND `options.preserve`', async () => {
    const css = await fixture('js-defined/js-defined-preserve');
    const result = await process(css, { preserve: true, variables });
    expect(result).toMatchSnapshot();
  });

  test('preserve var() values and clean injected declarations with `options.variables` AND `options.preserve` AND `options.preserveInjectedVariables: false`', async () => {
    const css = await fixture('js-defined/js-defined-preserve-injected');
    const result = await process(css, {
      preserve: true,
      preserveInjectedVariables: false,
      variables
    });
    expect(result).toMatchSnapshot();
  });

  test('cast non-string values to string', async () => {
    const css = await fixture('js-defined/js-defined-non-string-values-casted-to-string');
    const result = await process(css, { variables });
    expect(result).toMatchSnapshot();
  });
});
