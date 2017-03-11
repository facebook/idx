/**
 * Copyright (c) 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

'use strict'; // eslint-disable-line strict

jest.unmock('idx');

const idx = require('idx');

describe('idx', () => {
  it('returns properties that exist', () => {
    const a = {b: {c: 123}};
    expect(idx(a, _ => _.b.c)).toEqual(123);
  });

  it('throws non-"property access" errors', () => {
    const error = new Error('Expected error.');
    const a = {};
    Object.defineProperty(a, 'b', {
      get() {
        throw error;
      },
    });
    expect(() => idx(a, _ => _.b.c)).toThrow(error);
  });

  it('throws a `TypeError` when calling non-methods', () => {
    const a = {b: 'I am a string'};
    expect(() => idx(a, _ => _.b())).toThrow(
      new TypeError('_.b is not a function'),
    );
  });

  it('returns null for intermediate null properties', () => {
    const a = {b: null};
    expect(idx(a, _ => _.b.c)).toEqual(null);
  });

  it('returns undefined for intermediate undefined properties', () => {
    const a = {b: undefined};
    expect(idx(a, _ => _.b.c)).toEqual(undefined);
  });

  it('returns undefined for intermediate undefined array indexes', () => {
    const a = {b: []};
    expect(idx(a, _ => _.b[0].c)).toEqual(undefined);
  });
});
