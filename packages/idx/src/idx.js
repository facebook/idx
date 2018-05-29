/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @providesModule idx
 * @flow strict
 */

'use strict'; // eslint-disable-line strict

/**
 * Traverses properties on objects and arrays. If an intermediate property is
 * either null or undefined, it is instead returned. The purpose of this method
 * is to simplify extracting properties from a chain of maybe-typed properties.
 *
 * === EXAMPLE ===
 *
 * Consider the following type:
 *
 *   const props: {
 *     user: ?{
 *       name: string,
 *       friends: ?Array<User>,
 *     }
 *   };
 *
 * Getting to the friends of my first friend would resemble:
 *
 *   props.user &&
 *   props.user.friends &&
 *   props.user.friends[0] &&
 *   props.user.friends[0].friends
 *
 * Instead, `idx` allows us to safely write:
 *
 *   idx(props, _ => _.user.friends[0].friends)
 *
 * The second argument must be a function that returns one or more nested member
 * expressions. Any other expression has undefined behavior.
 *
 * === NOTE ===
 *
 * The code below exists for the purpose of illustrating expected behavior and
 * is not meant to be executed. The `idx` function is used in conjunction with a
 * Babel transform that replaces it with better performing code:
 *
 *   props.user == null ? props.user :
 *   props.user.friends == null ? props.user.friends :
 *   props.user.friends[0] == null ? props.user.friends[0] :
 *   props.user.friends[0].friends
 *
 * All this machinery exists due to the fact that an existential operator does
 * not currently exist in JavaScript.
 */
function idx<Ti, Tv>(input: Ti, accessor: (input: Ti) => Tv): ?Tv {
  try {
    return accessor(input);
  } catch (error) {
    if (error instanceof TypeError) {
      if (nullPattern.test(error)) {
        return null;
      } else if (undefinedPattern.test(error)) {
        return undefined;
      }
    }
    throw error;
  }
}

/**
 * Some actual error messages for null:
 *
 * TypeError: Cannot read property 'bar' of null
 * TypeError: Cannot convert null value to object
 * TypeError: foo is null
 * TypeError: null has no properties
 * TypeError: null is not an object (evaluating 'foo.bar')
 * TypeError: null is not an object (evaluating '(" undefined ", null).bar')
 */
const nullPattern = /^null | null$|^[^(]* null /i;
const undefinedPattern = /^undefined | undefined$|^[^(]* undefined /i;

idx.default = idx;
module.exports = idx;
