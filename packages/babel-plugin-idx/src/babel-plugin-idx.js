/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
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
      // E.g. `import '...'`
      if (node.specifiers.length === 0) {
        throw file.buildCodeFrameError(
          node,
          'The idx import must have a value.',
        );
      }
      // E.g. `import A, {B} from '...'`
      //      `import A, * as B from '...'`
      //      `import {A, B} from '...'`
      if (node.specifiers.length > 1) {
        throw file.buildCodeFrameError(
          node.specifiers[1],
          'The idx import must be a single specifier.',
        );
      }
      // `import {default as idx} from '...'` or `import idx from '...'` are ok.
      // `import idx, * as idx2 from '...'` is not ok but would've been caught
      // above.
      if (!t.isSpecifierDefault(node.specifiers[0])) {
        throw file.buildCodeFrameError(
          node.specifiers[0],
          'The idx import must be a default import.',
        );
      }
      // `importKind` is not a property unless flow syntax is enabled.
      // On specifiers, `importKind` is not "value" when it's not a type, it's
      // `null`.
      // E.g. `import type {...} from '...'`
      //      `import typeof {...} from '...'`
      //      `import {type ...} from '...'`.
      //      `import {typeof ...} from '...'`
      if (
        node.importKind === 'type' ||
        node.importKind === 'typeof' ||
        node.specifiers[0].importKind === 'type' ||
        node.specifiers[0].importKind === 'typeof'
      ) {
        throw file.buildCodeFrameError(
          node,
          'The idx import must be a value import.',
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
    if (t.isMemberExpression(node)) {
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
        'idx callbacks may only access properties on the callback parameter.',
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
    // Hoist to the top if it's an async method.
    if (path.scope.path.isClassMethod({async: true})) {
      path.scope.push({id: temp, _blockHoist: 3});
    } else {
      path.scope.push({id: temp});
    }
  }

  function isIdxImportOrRequire(node, name) {
    if (t.isImportDeclaration(node)) {
      return t.isStringLiteral(node.source, {value: name});
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
      if (!isIdxImportOrRequire(path.node, state.importName)) {
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
        const importName = state.opts.importName || 'idx';
        // If there can't reasonably be an idx call, exit fast.
        if (importName !== 'idx' || idxRe.test(state.file.code)) {
          // We're very strict about the shape of idx. Some transforms, like
          // "babel-plugin-transform-async-to-generator", will convert arrow
          // functions inside async functions into regular functions. So we do
          // our transformation before any one else interferes.
          const newState = {file: state.file, importName};
          path.traverse(declareVisitor, newState);
        }
      },
    },
  };
};
