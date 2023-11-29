[npm]: https://img.shields.io/npm/v/postcss-var-replace
[npm-url]: https://www.npmjs.com/package/postcss-var-replace

[![npm][npm]][npm-url]
[![Join our Discord](https://img.shields.io/badge/join_our-Discord-5a64ea)](https://discord.gg/FywZN57mTg)
[![libera manifesto](https://img.shields.io/badge/libera-manifesto-lightgrey.svg)](https://liberamanifesto.com)

# postcss-var-replace

[PostCSS](https://github.com/postcss/postcss) plugin to replace [CSS variables`](http://dev.w3.org/csswg/css-variables/) with their static values.

This plugin provides a future-proof way of using _most_ of CSS variables features, including selector cascading (with some caveats).

## Requirements

This package requires an [LTS](https://github.com/nodejs/Release) Node version (v18.0.0+)

## Install

```console
npm add postcss-var-replace
```

# Usage

[_For more general PostCSS usage, look here._](https://github.com/postcss/postcss#usage)

```js
import postcss from 'postcss';
import { postcssVarReplace } from 'postcss-var-replace';

const input = `
:root {
	--font-name: 'my-font-family-name';
}

@font-face {
	font-family: var(--font-name);
	src: url('myfont.woff2') format('woff2');
}`;

const { css } = postcss([postcssVarReplace()]).process(input);

console.log(css);
```

## Options

### `preserve`

Type: `boolean`<br>
Default: `false`

Allows you to preserve custom properties & var() usage in output.

Possible values:

- `false`: Removes `--var` declarations and replaces `var()` with their resolved/computed values.
- `true`: Keeps `var()` declarations in the output and has the computed value as a fallback declaration. Also keeps computed `--var` declarations.
- `'computed'`: Keeps computed `--var` declarations in the output. Handy to make them available to your JavaScript.
- `(declaration) => boolean|'computed'` : function/callback to programmatically return whether preserve the respective declaration

### `preserveAtRulesOrder`

Type: `boolean`<br>
Default: `false`

Keeps your at-rules like media queries in the order to defined them.

Ideally, this would be defaulted to `true` and it will be in the next major version. All of the tests expecations need to be updated and probably just drop support for `preserveAtRulesOrder: false`

### `preserveInjectedVariables`

Type: `boolean`<br>
Default: `true`

Whether to preserve the custom property declarations inserted via the `variables` option from final output.

A typical use case is [CSS Modules](https://github.com/css-modules/css-modules), where you would want to avoid
repeating custom property definitions in every module passed through this plugin. Setting this option to `false`
prevents JS-injected variables from appearing in output CSS.

```js
import postcss from 'postcss';
import { postcssVarReplace } from 'postcss-var-replace';

postcss([
  postcssVarReplace({
    variables: {
      '--some-var': '100px',
      '--other-var': {
        value: '#00ff00'
      },
      '--important-var': {
        value: '#ff0000',
        isImportant: true
      }
    }
  })
]).process(css, opts);
```

### `variables`

Type: `object`<br>
Default: `{}`

Define an object map of variables in JavaScript that will be declared at the `:root` scope.

Can be a simple key-value pair or an object with a `value` property and an optional `isImportant` bool property.

The object keys are automatically prefixed with `--` (according to CSS custom property syntax) if you do not provide it.

## Contributing, Working With This Repo

We 💛 contributions! After all, this is a community-driven project. We have no corporate sponsorship or backing. The maintainers and users keep this project going!

Please check out our [Contribution Guide](./CONTRIBUTING.md).

## Attribution

This is a modern fork of https://github.com/MadLittleMods/postcss-css-variables

## License

[MIT License](./LICENSE.md)
