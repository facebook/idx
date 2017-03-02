/**
 * Copyright (c) 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule idx
 * @flow
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
      if (isNullPropertyAccessError(error)) {
        return null;
      } else if (isUndefinedPropertyAccessError(error)) {
        return undefined;
      }
    }
    throw error;
  }
}

let nullPattern: ?RegExp;
function isNullPropertyAccessError({message}: TypeError): boolean {
  if (!nullPattern) {
    nullPattern = getInvalidPropertyAccessErrorPattern(null);
  }
  return nullPattern.test(message);
}

let undefinedPattern: ?RegExp;
function isUndefinedPropertyAccessError({message}: TypeError): boolean {
  if (!undefinedPattern) {
    undefinedPattern = getInvalidPropertyAccessErrorPattern(undefined);
  }
  return undefinedPattern.test(message);
}

/**
 * Use `new Function(...)` to avoid minifying "$object$" and "$property$".
 */
// eslint-disable-next-line no-new-func, flowtype/no-weak-types
const getInvalidPropertyAccessErrorPattern: any = new Function('$object$', `
  try {
    $object$.$property$;
  } catch (error) {
    return new RegExp(
      error.message
        .replace(/[-\\[\\]\\/\\{\\}\\(\\)\\*\\+\\?\\.\\\\\\^\\$\\|]/g, '\\\\$&')
        .replace('\\\\$object\\\\$', '.+')
        .replace('\\\\$property\\\\$', '.+')
    );
  }
  throw new Error('Expected property access on ' + $object$ + ' to throw.');
`);

module.exports = idx;
