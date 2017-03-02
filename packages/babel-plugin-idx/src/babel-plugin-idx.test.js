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

function transform(source) {
  return babelTransform(source, {
    plugins: [require('./babel-plugin-idx')],
    babelrc: false,
  }).code;
}

describe('babel-plugin-idx', () => {
  beforeEach(() => {
    function stringByTrimmingSpaces(string) {
      return string.replace(/\s+/g, '');
    }

    jasmine.addMatchers({
      toTransformInto: () => ({
        compare(input, expected) {
          const actual = transform(input);
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
            transform(input);
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
    });
  });

  it('transforms member expressions', () => {
    expect(`
      idx(base, _ => _.b.c.d.e);
    `).toTransformInto(`
      var _ref, _ref2, _ref3, _ref4;
      (_ref = base) != null ?
        (_ref2 = _ref.b) != null ?
          (_ref3 = _ref2.c) != null ?
            (_ref4 = _ref3.d) != null ?
              _ref4.e :
            _ref4 :
          _ref3 :
        _ref2 :
      _ref;
    `);
  });

  it('transforms bracket notation', () => {
    expect(`
      idx(base, _ => _["b"][0][c + d]);
    `).toTransformInto(`
      var _ref, _ref2, _ref3;
      (_ref = base) != null ?
        (_ref2 = _ref["b"]) != null ?
          (_ref3 = _ref2[0]) != null ?
            _ref3[c + d] :
          _ref3 :
        _ref2 :
      _ref;
    `);
  });

  it('transforms combination of both member access notations', () => {
    expect(`
      idx(base, _ => _.a["b"].c[d[e[f]]].g);
    `).toTransformInto(`
      var _ref, _ref2, _ref3, _ref4, _ref5;
      (_ref = base) != null ?
        (_ref2 = _ref.a) != null ?
          (_ref3 = _ref2["b"]) != null ?
            (_ref4 = _ref3.c) != null ?
              (_ref5 = _ref4[d[e[f]]]) != null ?
                _ref5.g :
              _ref5 :
            _ref4 :
          _ref3 :
        _ref2 :
      _ref;
    `);
  });

  it('transforms if the base is an expression', () => {
    expect(`
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
      idx(base, (a, b) => _.property);
    `).toThrowTransformError(
      'The arrow function supplied to `idx` must take exactly one parameter.',
    );
  });

  it('throws if the arrow function has an invalid body expression', () => {
    expect(`
      idx(base, a => b.property)
    `).toThrowTransformError(
      'The parameter of the arrow function supplied to `idx` must match the ' +
      'base of the body expression.',
    );
  });

  it('throws if the body of the arrow function is not an expression', () => {
    expect(`
      idx(base, _ => {})
    `).toThrowTransformError(
      'The body of the arrow function supplied to `idx` must be a single ' +
      'expression (without curly braces).',
    );
  });

  it('ignores non-function call idx', () => {
    expect(`
      result = idx;
    `).toTransformInto(`
      result = idx;
    `);
  });

  it('throws if idx is called with zero arguments', () => {
    expect(`
      idx();
    `).toThrowTransformError(
      'The `idx` function takes exactly two arguments.',
    );
  });

  it('throws if idx is called with one argument', () => {
    expect(`
      idx(1);
    `).toThrowTransformError(
      'The `idx` function takes exactly two arguments.',
    );
  });

  it('throws if idx is called with three arguments', () => {
    expect(`
      idx(1, 2, 3);
    `).toThrowTransformError(
      'The `idx` function takes exactly two arguments.',
    );
  });

  it('transforms idx calls as part of another expressions', () => {
    expect(`
      paddingStatement();
      a = idx(base, _ => _.b[c]);
    `).toTransformInto(`
      var _ref, _ref2;
      paddingStatement();
      a =
        (_ref = base) != null ?
          (_ref2 = _ref.b) != null ?
            _ref2[c] :
          _ref2 :
        _ref;
    `);
  });
});
