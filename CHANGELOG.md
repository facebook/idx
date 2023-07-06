# 3.0.0 / 2023-07-06

- **Breaking Change:** New Flow type definition requires `flow-bin@0.211.0`.
  - See the [updated documentation for `idx`](https://github.com/facebook/idx#static-typing) for additional configuration steps.
  - In the future, older versions of `idx` may no longer be compatible with newer versions of `flow-bin`. (https://github.com/facebook/idx/pull/854)

# 2.5.6 / 2019-05-05

- TypeScript: Refactor `DeepRequiredObject` using `extends`.

# 2.5.5 / 2019-03-13

- TypeScript: Make `DeepRequiredObject` omit primitive types.
- TypeScript: Update `UnboxDeepRequired` to check for objects and arrays before primitives.
- Moved `typescript` dependency down to `idx` package.

# 2.5.4 / 2019-02-21

- TypeScript: Fix bugs with the `UnboxDeepRequired` type.

# 2.5.3 / 2019-02-09

- TypeScript: Fix return type with new `UnboxDeepRequired` type.
- Upgraded multiple dependency version.

# 2.5.2 / 2018-11-26

- TypeScript: Allow nullable values.

# 2.5.1 / 2018-11-23

- TypeScript: Carry over argument types in methods.

# 2.5.0 / 2018-11-16

- TypeScript: Support `strictNullCheck` flag.

# 2.4.0 / 2018-06-11

- Fix a bug with `babel-plugin-idx` when dealing with nested `idx` calls.
- Upgraded to Flow strict.

# 2.3.0 / 2018-04-13

- Fix detection in browsers with capitalized `NULL` or `UNDEFINED`.

# 2.2.0 / 2017-10-27

- Added TypeScript definitions for `idx`.
- Relicensed `babel-plugin-idx` and `idx` as MIT.

# 2.1.0 / 2017-10-09

- Simplify `idx` error message parsing and remove `Function` constructor use.
- Export `idx` as `default` for use with `import`.

# 2.0.0 / 2017-08-31

- Disallow call expressions from within `idx` (originally introduced in 1.1.0).
- Disallow invalid type imports from `idx`.
- Change `babel-plugin-idx` to stop hardcoding `idx` (so it can be imported as any identifier).
- Fix `idx` calls in async methods.

# 1.5.1 / 2017-04-11

- Fix `babel-plugin-idx` when `idx`'s parent is a scope-creating expression.

# 1.5.0 / 2017-04-09

- Improve `babel-plugin-idx` to use only one temporary variable.
- Add fast path for source files without references to "idx".

# 1.4.0 / 2017-03-30

- Better `babel-plugin-idx` error messages.
- Add fast path for source files without references to "idx".

# 1.3.0 / 2017-03-29

- Fix `babel-plugin-idx` for async functions.

# 1.2.0 / 2017-03-22

- Strip `@providesModule` from `idx.js`.

# 1.1.0 / 2017-03-13

- Added support for method calls (eg. `idx(foo, _ => _.bar())`).

# 1.0.1 / 2017-03-13

- Initial release.
