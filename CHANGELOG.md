2.0.0 / 2017-08-31
==================

  * Disallow call expressions from within `idx` (originally introduced in 1.1.0).
  * Disallow invalid type imports from `idx`.
  * Change `babel-plugin-idx` to stop hardcoding `idx` (so it can be imported as any identifier).
  * Fix `idx` calls in async methods.

1.5.1 / 2017-04-11
==================

  * Fix `babel-plugin-idx` when `idx`'s parent is a scope-creating expression.

1.5.0 / 2017-04-09
==================

  * Improve `babel-plugin-idx` to use only one temporary variable.
  * Add fast path for source files without references to "idx".

1.4.0 / 2017-03-30
==================

  * Better `babel-plugin-idx` error messages.
  * Add fast path for source files without references to "idx".

1.3.0 / 2017-03-29
==================

  * Fix `babel-plugin-idx` for async functions.

1.2.0 / 2017-03-22
==================

  * Strip `@providesModule` from `idx.js`.

1.1.0 / 2017-03-13
==================

  * Added support for method calls (eg. `idx(foo, _ => _.bar())`).

1.0.1 / 2017-03-13
==================

  * Initial release.
