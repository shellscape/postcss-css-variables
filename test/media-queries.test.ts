import { fixture, process } from './helpers';

describe('media queries', () => {
  test('should add rule declaration of property in @media', async () => {
    const css = await fixture('media/query');
    const result = await process(css, { preserveAtRulesOrder: true });
    expect(result).toMatchSnapshot();
  });

  test('should work with @media, preserving rule order', async () => {
    const css = await fixture('media/preserve-rule-order');
    const result = await process(css, { preserveAtRulesOrder: true });
    expect(result).toMatchSnapshot();
  });

  test('should work with nested @media', async () => {
    const css = await fixture('media/nested');
    const result = await process(css, { preserveAtRulesOrder: false });
    expect(result).toMatchSnapshot();
  });

  test('should work with nested @media, preserving rule order', async () => {
    const css = await fixture('media/nested-preserver-rule-order');
    const result = await process(css, { preserveAtRulesOrder: true });
    expect(result).toMatchSnapshot();
  });

  test('preserves variables in @media when `preserve` is `true`', async () => {
    const css = await fixture('media/preserve-variables');
    const result = await process(css, { preserveAtRulesOrder: true });
    expect(result).toMatchSnapshot();
  });

  test('should not double media queryies', async () => {
    const css = await fixture('media/double');
    const result = await process(css, { preserveAtRulesOrder: true });
    expect(result).toMatchSnapshot();
  });
});
