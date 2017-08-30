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

  function checkIdxBindingNode(file, node) {
    if (t.isImportDeclaration(node)) {
      if (node.specifiers.length === 0) {
        throw file.buildCodeFrameError(
          node,
          'The idx import must have a value.',
        );
      }
      if (node.specifiers.length > 1) {
        throw file.buildCodeFrameError(
          node.specifiers[1],
          'The idx import must be a single specifier.',
        );
      }
      // importKind is not "value" when it's not a type :/
      // E.g. `import {type idx} from ...`
      // Not to be confused with:
      //    `import type idx from ...` or
      //    `import type {idx} from ...`
      if (node.specifiers[0].importKind != null) {
        throw file.buildCodeFrameError(
          node.specifiers[0],
          'The idx import must be a value import.',
        );
      }
      // `import {default as idx} from ...` or `import idx from ...` are ok.
      if (!t.isSpecifierDefault(node.specifiers[0])) {
        throw file.buildCodeFrameError(
          node.specifiers[0],
          'The idx import must be a default import.',
        );
      }
    } else if (t.isVariableDeclarator(node)) {
      // E.g. var {idx} or var [idx]
      if (!t.isIdentifier(node.id)) {
        throw file.buildCodeFrameError(
          node.specifiers[0],
          'The idx declaration must be an identifier.',
        );
      }
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

  function visitIdxCallExpression(path, state) {
    const node = path.node;
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
  }

  function isIdxImportOrRequire(node, name) {
    if (t.isImportDeclaration(node)) {
      // importKind is not a property unless flow syntax is enabled.
      return (node.importKind == null || node.importKind === 'value') &&
             t.isStringLiteral(node.source, {value: name});
    } else if (t.isVariableDeclarator(node)) {
      return t.isCallExpression(node.init) &&
             t.isIdentifier(node.init.callee, {name: 'require'}) &&
             t.isLiteral(node.init.arguments[0], {value: name});
    } else {
      return false;
    }
  }

  const declareVisitor = {
    'ImportDeclaration|VariableDeclarator'(path, state) {
      const importName = state.opts.importName || 'idx';

      if (!isIdxImportOrRequire(path.node, importName)) {
        return;
      }

      checkIdxBindingNode(state.file, path.node);

      const bindingName = t.isImportDeclaration(path.node)
        ? path.node.specifiers[0].local.name
        : path.node.id.name;
      const idxBinding = path.scope.getOwnBinding(bindingName);

      idxBinding.constantViolations.forEach(refPath => {
        throw state.file.buildCodeFrameError(
          refPath.node,
          '`idx` cannot be redefined.',
        );
      });

      let didTransform = false;
      let didSkip = false;
      idxBinding.referencePaths.forEach(refPath => {
        if (refPath.node === idxBinding.node) {
          // Do nothing...
        } else if (refPath.parentPath.isCallExpression()) {
          visitIdxCallExpression(refPath.parentPath, state);
          didTransform = true;
        } else {
          // Should this throw?
          didSkip = true;
        }
      });
      if (didTransform && !didSkip) {
        path.remove();
      }
    },
  };

  return {
    visitor: {
      Program(path, state) {
        // If there can't reasonably be an idx call, exit fast.
        if (idxRe.test(state.file.code)) {
          // We're very strict about the shape of idx. Some transforms, like
          // "babel-plugin-transform-async-to-generator", will convert arrow
          // functions inside async functions into regular functions. So we do
          // our transformation before any one else interferes.
          path.traverse(declareVisitor, state);
        }
      },
    },
  };
};
