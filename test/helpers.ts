import { readFile } from 'fs/promises';
import { join } from 'path';

import cssnano from 'cssnano';
import postcss, { type Result } from 'postcss';
import normalizeWhitespace from 'postcss-normalize-whitespace';
import discardComments from 'postcss-discard-comments';

import { postcssVarReplace, type PostCssVarReplaceOptions } from '../dist';

export const fixture = async (filename: string) => {
  const result = await readFile(join(__dirname, 'fixtures', `${filename}.css`), 'utf8');
  return result;
};

export const process = async (css: string, options?: PostCssVarReplaceOptions, raw?: boolean) => {
  const result = await postcss([
    postcssVarReplace(options),
    cssnano({
      preset: { plugins: [normalizeWhitespace, discardComments] }
    })
  ]).process(String(css), { from: void 0 });

  if (raw) return result as Result;

  return result.css;
};
