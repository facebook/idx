/**
 * Copyright (c) 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

'use strict'; // eslint-disable-line strict

module.exports = context => {
  const t = context.types;

  const idxRe = /\bidx\b/;

  function checkIdxArguments(file, node) {
    const args = node.arguments;
    if (args.length !== 2) {
      throw file.buildCodeFrameError(
        node,
        'The `idx` function takes exactly two arguments.',
      );
    }
    const arrowFunction = args[1];
    if (!t.isArrowFunctionExpression(arrowFunction)) {
      throw file.buildCodeFrameError(
        arrowFunction,
        'The second argument supplied to `idx` must be an arrow function.',
      );
    }
    if (!t.isExpression(arrowFunction.body)) {
      throw file.buildCodeFrameError(
        arrowFunction.body,
        'The body of the arrow function supplied to `idx` must be a single ' +
        'expression (without curly braces).',
      );
    }
    if (arrowFunction.params.length !== 1) {
      throw file.buildCodeFrameError(
        arrowFunction.params[2] || arrowFunction,
        'The arrow function supplied to `idx` must take exactly one parameter.',
      );
    }
    const input = arrowFunction.params[0];
    if (!t.isIdentifier(input)) {
      throw file.buildCodeFrameError(
        arrowFunction.params[0],
        'The parameter supplied to `idx` must be an identifier.',
      );
    }
  }

  function makeCondition(node, state, inside) {
    if (inside) {
      return t.ConditionalExpression(
        t.BinaryExpression(
          '!=',
          t.AssignmentExpression('=', state.temp, node),
          t.NullLiteral(),
        ),
        inside,
        state.temp,
      );
    } else {
      return node;
    }
  }

  function makeChain(node, state, inside) {
    if (t.isCallExpression(node)) {
      return makeChain(
        node.callee,
        state,
        makeCondition(
          t.CallExpression(state.temp, node.arguments),
          state,
          inside,
        ),
      );
    } else if (t.isMemberExpression(node)) {
      return makeChain(
        node.object,
        state,
        makeCondition(
          t.MemberExpression(state.temp, node.property, node.computed),
          state,
          inside,
        ),
      );
    } else if (t.isIdentifier(node)) {
      if (node.name !== state.base.name) {
        throw state.file.buildCodeFrameError(
          node,
          'The parameter of the arrow function supplied to `idx` must match ' +
          'the base of the body expression.',
        );
      }
      return makeCondition(state.input, state, inside);
    } else {
      throw state.file.buildCodeFrameError(
        node,
        'The `idx` body can only be composed of properties and methods.',
      );
    }
  }

  function transform(path, state) {
    const node = path.node;

    if (!t.isCallExpression(node)) {
      return false;
    }

    checkIdxArguments(state.file, node);
    const temp = path.scope.generateUidIdentifier('ref');
    const replacement = makeChain(
      node.arguments[1].body,
      {
        file: state.file,
        input: node.arguments[0],
        base: node.arguments[1].params[0],
        temp,
      },
    );
    path.replaceWith(replacement);
    path.scope.push({id: temp});

    return true;
  }

  function getRequireIdxName(path) {
    const node = path.node;

    if (
      t.isIdentifier(node.callee, {name: 'require'}) &&
      t.isLiteral(node.arguments[0], {value: 'idx'}) &&
      t.isIdentifier(path.parentPath.node.id)
    ) {
      return path.parentPath.node.id.name;
    }

    return null;
  }

  function getImportIdxName(path) {
    if (
      t.isStringLiteral(path.node.source, {value: 'idx'}) &&
      path.node.specifiers.length === 1
    ) {
      return path.node.specifiers[0].local.name;
    }

    return null;
  }

  const idxVisitor = {
    CallExpression(path, state) {
      const requireName = getRequireIdxName(path);

      if (requireName === null) {
        return;
      }

      const binding = path.scope.getBinding(requireName);

      const allTransformed = binding.referencePaths.every(
        node => transform(node.parentPath, state),
      );

      // If we have transformed all the references to `idx`
      // we can remove the import.
      if (allTransformed) {
        path.parentPath.remove();
      }
    },
    ImportDeclaration(path, state) {
      const importName = getImportIdxName(path);

      if (importName === null) {
        return;
      }

      const binding = path.scope.getBinding(importName);

      const allTransformed = binding.referencePaths.every(
        node => transform(node.parentPath, state),
      );

      // If we have transformed all the references to `idx`
      // we can remove the import.
      if (allTransformed) {
        path.remove();
      }
    },
  };

  return {
    visitor: {
      Program(path, state) {
        // If there can't reasonably be an idx call, exit fast.
        if (path.scope.getOwnBinding('idx') || idxRe.test(state.file.code)) {
          // We're very strict about the shape of idx. Some transforms, like
          // "babel-plugin-transform-async-to-generator", will convert arrow
          // functions inside async functions into regular functions. So we do
          // our transformation before any one else interferes.
          path.traverse(idxVisitor, state);
        }
      },
    },
  };
};
