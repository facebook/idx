/**
 * Copyright (c) 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

'use strict'; // eslint-disable-line strict

jest.autoMockOff();

const {transform: babelTransform} = require('babel-core');
const babelPluginIdx = require('./babel-plugin-idx');
const transformAsyncToGenerator = require('babel-plugin-transform-async-to-generator');
const syntaxFlow = require('babel-plugin-syntax-flow');
const vm = require('vm');

function transform(source, plugins, options) {
  return babelTransform(source, {
    plugins: plugins || [[babelPluginIdx, options]],
    babelrc: false,
  }).code;
}

const asyncToGeneratorHelperCode = `
  function _asyncToGenerator(fn) {
    return function () {
      var gen = fn.apply(this, arguments);
      return new Promise(function (resolve, reject) {
        function step(key, arg) {
          try {
            var info = gen[key](arg);
            var value = info.value;
          } catch (error) {
            reject(error); return;
          } if (info.done) {
            resolve(value);
          } else {
            return Promise.resolve(value).then(function (value) {
              step("next", value);
            }, function (err) {
              step("throw", err);
            });
          }
        }
        return step("next");
      });
    };
  }
`;

describe('babel-plugin-idx', () => {
  beforeEach(() => {
    function stringByTrimmingSpaces(string) {
      return string.replace(/\s+/g, '');
    }

    jasmine.addMatchers({
      toTransformInto: () => ({
        compare(input, expected) {
          const plugins = typeof input === 'string' ? null : input.plugins;
          const options = typeof input === 'string' ? undefined : input.options;
          const code = typeof input === 'string' ? input : input.code;
          const actual = transform(code, plugins, options);
          const pass =
            stringByTrimmingSpaces(actual) ===
            stringByTrimmingSpaces(expected);
          return {
            pass,
            message:
              'Expected input to transform into:\n' + expected + '\n' +
              'Instead, got:\n' + actual,
          };
        },
      }),
      toThrowTransformError: () => ({
        compare(input, expected) {
          try {
            const plugins = typeof input === 'string' ? null : input.plugins;
            const options = typeof input === 'string' ? undefined : input.options;
            const code = typeof input === 'string' ? input : input.code;
            transform(code, plugins, options);
          } catch (error) {
            const actual = error.message.substr(9); // Strip "unknown:".
            return {
              pass: actual === expected,
              message:
                'Expected transform to throw "' + expected + '", but instead ' +
                'got "' + actual + '".',
            };
          }
          return {
            pass: false,
            message: 'Expected transform to throw "' + expected + '".',
          };
        },
      }),
      toReturn: () => ({
        compare(input, expected) {
          const code = transform(input, undefined);
          const actual = vm.runInNewContext(code);
          return {
            pass: actual === expected,
            message: 'Expected "' + expected + '" but got "' + actual + '".',
          };
        },
      }),
    });
  });

  it('transforms member expressions', () => {
    expect(`
      const idx = require('idx');
      idx(base, _ => _.b.c.d.e);
    `).toTransformInto(`
      var _ref;
      (_ref = base) != null ?
        (_ref = _ref.b) != null ?
          (_ref = _ref.c) != null ?
            (_ref = _ref.d) != null ?
              _ref.e :
            _ref :
          _ref :
        _ref :
      _ref;
    `);
  });

  it('transforms call expressions', () => {
    expect(`
      const idx = require('idx');
      idx(base, _ => _.b.c(...foo)().d(bar, null, [...baz]));
    `).toTransformInto(`
      var _ref;
      (_ref = base) != null ?
        (_ref = _ref.b) != null ?
          (_ref = _ref.c) != null ?
            (_ref = _ref(...foo)) != null ?
              (_ref = _ref()) != null ?
                (_ref = _ref.d) != null ?
                  _ref(bar, null, [...baz]) :
                _ref :
              _ref :
            _ref :
          _ref :
        _ref :
      _ref;
    `);
  });

  it('transforms bracket notation', () => {
    expect(`
      const idx = require('idx');
      idx(base, _ => _["b"][0][c + d]);
    `).toTransformInto(`
      var _ref;
      (_ref = base) != null ?
        (_ref = _ref["b"]) != null ?
          (_ref = _ref[0]) != null ?
            _ref[c + d] :
          _ref :
        _ref :
      _ref;
    `);
  });

  it('transforms bracket notation call expressions', () => {
    expect(`
      const idx = require('idx');
      idx(base, _ => _["b"](...foo)()[0][c + d](bar, null, [...baz]));
    `).toTransformInto(`
      var _ref;
      (_ref = base) != null ?
        (_ref = _ref["b"]) != null ?
          (_ref = _ref(...foo)) != null ?
            (_ref = _ref()) != null ?
              (_ref = _ref[0]) != null ?
                (_ref = _ref[c + d]) != null ?
                  _ref(bar, null, [...baz]) :
                _ref :
              _ref :
            _ref :
          _ref :
        _ref :
      _ref;
    `);
  });

  it('transforms combination of both member access notations', () => {
    expect(`
      const idx = require('idx');
      idx(base, _ => _.a["b"].c[d[e[f]]].g);
    `).toTransformInto(`
      var _ref;
      (_ref = base) != null ?
        (_ref = _ref.a) != null ?
          (_ref = _ref["b"]) != null ?
            (_ref = _ref.c) != null ?
              (_ref = _ref[d[e[f]]]) != null ?
                _ref.g :
              _ref :
            _ref :
          _ref :
        _ref :
      _ref;
    `);
  });

  it('transforms if the base is an expression', () => {
    expect(`
      const idx = require('idx');
      idx(this.props.base[5], _ => _.property);
    `).toTransformInto(`
      var _ref;
      (_ref = this.props.base[5]) != null ?
        _ref.property :
      _ref;
    `);
  });

  it('throws if the arrow function has more than one param', () => {
    expect(`
      const idx = require('idx');
      idx(base, (a, b) => _.property);
    `).toThrowTransformError(
      'The arrow function supplied to `idx` must take exactly one parameter.',
    );
  });

  it('throws if the arrow function has an invalid base', () => {
    expect(`
      const idx = require('idx');
      idx(base, a => b.property)
    `).toThrowTransformError(
      'The parameter of the arrow function supplied to `idx` must match the ' +
      'base of the body expression.',
    );
  });

  it('throws if the arrow function expression has non-properties/methods', () => {
    expect(`
      const idx = require('idx');
      idx(base, _ => (_.a++).b.c);
    `).toThrowTransformError(
      'The `idx` body can only be composed of properties and methods.',
    );
  });

  it('throws if the body of the arrow function is not an expression', () => {
    expect(`
      const idx = require('idx');
      idx(base, _ => {})
    `).toThrowTransformError(
      'The body of the arrow function supplied to `idx` must be a single ' +
      'expression (without curly braces).',
    );
  });

  it('ignores non-function call idx', () => {
    expect(`
      const idx = require('idx');
      result = idx;
    `).toTransformInto(`
      const idx = require('idx');
      result = idx;
    `);
  });

  it('throws if idx is called with zero arguments', () => {
    expect(`
      const idx = require('idx');
      idx();
    `).toThrowTransformError(
      'The `idx` function takes exactly two arguments.',
    );
  });

  it('throws if idx is called with one argument', () => {
    expect(`
      const idx = require('idx');
      idx(1);
    `).toThrowTransformError(
      'The `idx` function takes exactly two arguments.',
    );
  });

  it('throws if idx is called with three arguments', () => {
    expect(`
      const idx = require('idx');
      idx(1, 2, 3);
    `).toThrowTransformError(
      'The `idx` function takes exactly two arguments.',
    );
  });

  it('transforms idx calls as part of another expressions', () => {
    expect(`
      const idx = require('idx');
      paddingStatement();
      a = idx(base, _ => _.b[c]);
    `).toTransformInto(`
      var _ref;
      paddingStatement();
      a =
        (_ref = base) != null ?
          (_ref = _ref.b) != null ?
            _ref[c] :
          _ref :
        _ref;
    `);
  });

  it('transforms idx calls inside async functions (plugin order #1)', () => {
    expect({
      plugins: [babelPluginIdx, transformAsyncToGenerator],
      code: `
        const idx = require('idx');
        async function f() {
          idx(base, _ => _.b.c.d.e);
        }
      `,
    }).toTransformInto(`
      let f = (() => {
        var _ref2 = _asyncToGenerator(function* () {
          var _ref;
          (_ref = base) != null ?
            (_ref = _ref.b) != null ?
              (_ref = _ref.c) != null ?
                (_ref = _ref.d) != null ?
                  _ref.e :
                _ref :
              _ref :
            _ref :
          _ref;
        });

        return function f() {
          return _ref2.apply(this, arguments);
        };
      })();

      ${asyncToGeneratorHelperCode}
    `);
  });

  it('transforms idx calls inside async functions (plugin order #2)', () => {
    expect({
      plugins: [transformAsyncToGenerator, babelPluginIdx],
      code: `
        const idx = require('idx');
        async function f() {
          idx(base, _ => _.b.c.d.e);
        }
      `,
    }).toTransformInto(`
      let f = (() => {
        var _ref2 = _asyncToGenerator(function* () {
          var _ref;
          (_ref = base) != null ?
            (_ref = _ref.b) != null ?
              (_ref = _ref.c) != null ?
                (_ref = _ref.d) != null ?
                  _ref.e :
                _ref :
              _ref :
            _ref :
          _ref;
        });

        return function f() {
          return _ref2.apply(this, arguments);
        };
      })();

      ${asyncToGeneratorHelperCode}
    `);
  });

  it('transforms idx calls in async methods', () => {
    expect({
      plugins: [transformAsyncToGenerator, babelPluginIdx],
      code: `
        const idx = require('idx');
        class Foo {
          async bar() {
            idx(base, _ => _.b);
            return this;
          }
        }
      `,
    }).toTransformInto(`
      ${asyncToGeneratorHelperCode}

      class Foo {
        bar() {
          var _this = this;
          return _asyncToGenerator(function* () {
            var _ref;
            (_ref = base) != null ? _ref.b : _ref;
            return _this;
          })();
        }
      }
    `);
  });

  it('transforms idx calls when an idx import binding is in scope', () => {
    expect(`
      import idx from 'idx';
      idx(base, _ => _.b);
    `).toTransformInto(`
      var _ref;
      (_ref = base) != null ? _ref.b : _ref;
    `);
  });

  it('transforms idx calls when an idx const binding is in scope', () => {
    expect(`
      const idx = require('idx');
      idx(base, _ => _.b);
    `).toTransformInto(`
      var _ref;
      (_ref = base) != null ? _ref.b : _ref;
    `);
  });

  it('transforms deep idx calls when an idx import binding is in scope', () => {
    expect(`
      import idx from 'idx';
      function f() {
        idx(base, _ => _.b);
      }
    `).toTransformInto(`
      function f() {
        var _ref;
        (_ref = base) != null ? _ref.b : _ref;
      }
    `);
  });

  it('transforms deep idx calls when an idx const binding is in scope', () => {
    expect(`
      const idx = require('idx');
      function f() {
        idx(base, _ => _.b);
      }
    `).toTransformInto(`
      function f() {
        var _ref;
        (_ref = base) != null ? _ref.b : _ref;
      }
    `);
  });

  it('transforms base call expressions', () => {
    expect(`
      const idx = require('idx');
      idx(base, _ => _().b.c);
    `).toTransformInto(`
      var _ref;
      (_ref = base) != null ?
        (_ref = _ref()) != null ?
          (_ref = _ref.b) != null ?
            _ref.c :
          _ref :
        _ref :
      _ref;
    `);
  });

  it('transforms when the idx parent is a scope creating expression', () => {
    expect(`
      const idx = require('idx');
      (() => idx(base, _ => _.b));
    `).toTransformInto(`
      () => {
        var _ref;
        return (_ref = base) != null ? _ref.b : _ref;
      };
    `);
  });

  it('throws if redefined before use', () => {
    expect(`
      let idx = require('idx');
      idx = null;
      idx(base, _ => _.b);
    `).toThrowTransformError(
      '`idx` cannot be redefined.',
    );
  });

  it('throws if redefined after use', () => {
    expect(`
      let idx = require('idx');
      idx(base, _ => _.b);
      idx = null;
    `).toThrowTransformError(
      '`idx` cannot be redefined.',
    );
  });

  it('throws if there is a scope conflict', () => {
    expect(`
      let idx = require('idx');
      idx(base, _ => _.b);
      function idx() {}
    `).toThrowTransformError(
      '`idx` cannot be redefined.',
    );
  });

  it('handles sibling scopes with unique idx', () => {
    expect(`
      function aaa() {
        const idx = require('idx');
        idx(base, _ => _.b);
      }
      function bbb() {
        const idx = require('idx');
        idx(base, _ => _.b);
      }
    `).toTransformInto(`
      function aaa() {
        var _ref;
        (_ref = base) != null ? _ref.b : _ref;
      }
      function bbb() {
        var _ref2;
        (_ref2 = base) != null ? _ref2.b : _ref2;
      }
    `);
  });

  it('handles sibling scopes with and without idx', () => {
    expect(`
      function aaa() {
        const idx = require('idx');
        idx(base, _ => _.b);
      }
      function bbb() {
        idx(base, _ => _.b);
      }
    `).toTransformInto(`
      function aaa() {
        var _ref;
        (_ref = base) != null ? _ref.b : _ref;
      }
      function bbb() {
        idx(base, _ => _.b);
      }
    `);
  });

  it('handles nested scopes with shadowing', () => {
    expect(`
      const idx = require('idx');
      idx(base, _ => _.b);
      function aaa() {
        idx(base, _ => _.b);
        function bbb(idx) {
          idx(base, _ => _.b);
        }
      }
    `).toTransformInto(`
      var _ref;
      (_ref = base) != null ? _ref.b : _ref;
      function aaa() {
        var _ref2;
        (_ref2 = base) != null ? _ref2.b : _ref2;
        function bbb(idx) {
          idx(base, _ => _.b);
        }
      }
    `);
  });

  it('throws on type imports', () => {
    expect({
      plugins: [babelPluginIdx, syntaxFlow],
      code: `
        import type idx from 'idx';
        idx(base, _ => _.b);
      `,
    }).toThrowTransformError(
      'The idx import must be a value import.',
    );
  });

  it('throws on typeof imports', () => {
    expect({
      plugins: [babelPluginIdx, syntaxFlow],
      code: `
        import typeof idx from 'idx';
        idx(base, _ => _.b);
      `,
    }).toThrowTransformError(
      'The idx import must be a value import.',
    );
  });

  it('throws on type import specifier', () => {
    expect({
      plugins: [babelPluginIdx, syntaxFlow],
      code: `
        import {type idx} from 'idx';
        idx(base, _ => _.b);
      `,
    }).toThrowTransformError(
      'The idx import must be a default import.',
    );
  });

  it('throws on typeof import specifier', () => {
    expect({
      plugins: [babelPluginIdx, syntaxFlow],
      code: `
        import {typeof idx} from 'idx';
        idx(base, _ => _.b);
      `,
    }).toThrowTransformError(
      'The idx import must be a default import.',
    );
  });

  it('throws on type default import specifier', () => {
    expect({
      plugins: [babelPluginIdx, syntaxFlow],
      code: `
        import {type default as idx} from 'idx';
        idx(base, _ => _.b);
      `,
    }).toThrowTransformError(
      'The idx import must be a value import.',
    );
  });

  it('throws on typeof default import specifier', () => {
    expect({
      plugins: [babelPluginIdx, syntaxFlow],
      code: `
        import {typeof default as idx} from 'idx';
        idx(base, _ => _.b);
      `,
    }).toThrowTransformError(
      'The idx import must be a value import.',
    );
  });


  it('throws on named idx import', () => {
    expect(`
      import {idx} from 'idx';
      idx(base, _ => _.b);
    `).toThrowTransformError(
      'The idx import must be a default import.',
    );
  });

  it('throws on namespace idx import', () => {
    expect(`
      import * as idx from 'idx';
      idx(base, _ => _.b);
    `).toThrowTransformError(
      'The idx import must be a default import.',
    );
  });

  it('throws on default plus named import', () => {
    expect(`
      import idx, {foo} from 'idx';
      idx(base, _ => _.b);
    `).toThrowTransformError(
      'The idx import must be a single specifier.',
    );
  });

  it('throws on default plus namespace import', () => {
    expect(`
      import idx, * as foo from 'idx';
      idx(base, _ => _.b);
    `).toThrowTransformError(
      'The idx import must be a single specifier.',
    );
  });

  it('throws on named default plus other import', () => {
    expect(`
      import {default as idx, foo} from 'idx';
      idx(base, _ => _.b);
    `).toThrowTransformError(
      'The idx import must be a single specifier.',
    );
  });

  it('handles named default imports', () => {
    expect(`
      import {default as idx} from 'idx';
      idx(base, _ => _.b);
    `).toTransformInto(`
      var _ref;
      (_ref = base) != null ? _ref.b : _ref;
    `);
  });

  it('unused idx import should be left alone', () => {
    expect(`
      import idx from 'idx';
    `).toTransformInto(`
      import idx from 'idx';
    `);
  });

  it('allows configuration of the import name', () => {
    expect({
      code: `
        import i_d_x from 'i_d_x';
        i_d_x(base, _ => _.b);
      `,
      options: {importName: 'i_d_x'},
    }).toTransformInto(`
      var _ref;
      (_ref = base) != null ? _ref.b : _ref;
    `);
  });

  it('follows configuration of the import name', () => {
    expect({
      code: `
        import idx from 'idx';
        import i_d_x from 'i_d_x';
        i_d_x(base, _ => _.b);
        idx(base, _ => _.c);
      `,
      options: {importName: 'i_d_x'},
    }).toTransformInto(`
      var _ref;
      import idx from 'idx';
      (_ref = base) != null ? _ref.b : _ref;
      idx(base, _ => _.c);
    `);
  });

  it('allows configuration of the require name', () => {
    expect({
      code: `
        const i_d_x = require('i_d_x');
        i_d_x(base, _ => _.b);
      `,
      options: {importName: 'i_d_x'},
    }).toTransformInto(`
      var _ref;
      (_ref = base) != null ? _ref.b : _ref;
    `);
  });

  it('follows configuration of the require name', () => {
    expect({
      code: `
        const idx = require('idx');
        const i_d_x = require('i_d_x');
        i_d_x(base, _ => _.b);
        idx(base, _ => _.c);
      `,
      options: {importName: 'i_d_x'},
    }).toTransformInto(`
      var _ref;
      const idx = require('idx');
      (_ref = base) != null ? _ref.b : _ref;
      idx(base, _ => _.c);
    `);
  });

  describe('functional', () => {
    it('works with only properties', () => {
      expect(`
        const idx = require('idx');
        const base = {a: {b: {c: 2}}};
        idx(base, _ => _.a.b.c);
      `).toReturn(2);
    });

    it('works with a method in the start', () => {
      expect(`
        const idx = require('idx');
        const base = {a: {b: {c: () => 2}}};
        idx(base, _ => _.a.b.c());
      `).toReturn(2);
    });

    it('works with a method in the end', () => {
      expect(`
        const idx = require('idx');
        const base = () => ({a: {b: {c: 2}}});
        idx(base, _ => _().a.b.c);
      `).toReturn(2);
    });

    it('works with a method in the middle', () => {
      expect(`
        const idx = require('idx');
        const base = {a: () => ({b: {c: 2}})};
        idx(base, _ => _.a().b.c);
      `).toReturn(2);
    });

    it('works with missing properties', () => {
      expect(`
        const idx = require('idx');
        const base = {a: {b: {}}};
        idx(base, _ => _.a.b.c);
      `).toReturn(undefined);
    });

    it('works with null properties', () => {
      expect(`
        const idx = require('idx');
        const base = {a: {b: null}};
        idx(base, _ => _.a.b.c);
      `).toReturn(null);
    });
  });
});
