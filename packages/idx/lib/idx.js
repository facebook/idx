/**
 * Copyright 2004-present Facebook. All Rights Reserved.
 *
 * @providesModule idx
 * 
 */
'use strict';

/* eslint-disable no-new-func */

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

function idx(input, accessor) {
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

var nullPattern = void 0;
function isNullPropertyAccessError(_ref) {
  var message = _ref.message;

  if (!nullPattern) {
    nullPattern = getInvalidPropertyAccessErrorPattern(null);
  }
  return nullPattern.test(message);
}

var undefinedPattern = void 0;
function isUndefinedPropertyAccessError(_ref2) {
  var message = _ref2.message;

  if (!undefinedPattern) {
    undefinedPattern = getInvalidPropertyAccessErrorPattern(undefined);
  }
  return undefinedPattern.test(message);
}

/**
 * Use `new Function(...)` to avoid minifying "$object$" and "$property$".
 */
var getInvalidPropertyAccessErrorPattern = new Function('$object$', '\n  try {\n    $object$.$property$;\n  } catch (error) {\n    return new RegExp(\n      error.message\n        .replace(/[-\\[\\]\\/\\{\\}\\(\\)\\*\\+\\?\\.\\\\\\^\\$\\|]/g, \'\\\\$&\')\n        .replace(\'\\\\$object\\\\$\', \'.+\')\n        .replace(\'\\\\$property\\\\$\', \'.+\')\n    );\n  }\n  throw new Error(\'Expected property access on \' + $object$ + \' to throw.\');\n');

module.exports = idx;