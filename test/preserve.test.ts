import { fixture, process } from './helpers';

describe('preserve values', async () => {
  test('preserves variables when `preserve` is `true`', async () => {
    const css = await fixture('preserve-value/preserve-variables');
    const result = await process(css, { preserve: true });
    expect(result).toMatchSnapshot();
  });

  test('preserves computed value when `preserve` is `computed`', async () => {
    const css = await fixture('preserve-value/preserve-computed');
    const result = await process(css, { preserve: 'computed' });
    expect(result).toMatchSnapshot();
  });

  test('preserves variables when `preserve` function applies', async () => {
    const css = await fixture('preserve-value/preserve-variables-conditionally');
    const result = await process(css, {
      preserve(declaration) {
        return !(
          declaration.prop.includes('--no-preserve') || declaration.value.includes('--no-preserve')
        );
      }
    });
    expect(result).toMatchSnapshot();
  });
});
