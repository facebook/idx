/**
 * Copyright 2004-present Facebook. All Rights Reserved.
 */

'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

module.exports = function (context) {
  var t = context.types;

  var TransformedTernary = function () {
    function TransformedTernary(expression, generateUid) {
      _classCallCheck(this, TransformedTernary);

      this.generateUid = generateUid;

      this.uids = [];
      this.expression = expression;
      this.deepestTernary = null;
      this.deepestExpression = expression;
    }

    _createClass(TransformedTernary, [{
      key: 'constructTernary',
      value: function constructTernary(oldExpression, newExpression, uid) {
        return t.ConditionalExpression(t.BinaryExpression('!=', t.AssignmentExpression('=', t.Identifier(uid), oldExpression), t.NullLiteral()), newExpression, t.Identifier(uid));
      }
    }, {
      key: 'addLevel',
      value: function addLevel(expression, uid) {
        var ternary = this.constructTernary(this.deepestExpression, expression, uid);
        if (this.deepestTernary === null) {
          this.expression = ternary;
        } else {
          this.deepestTernary.consequent = ternary;
        }
        this.deepestTernary = ternary;
        this.deepestExpression = expression;
      }
    }, {
      key: 'appendPropertyAccess',
      value: function appendPropertyAccess(property, computed) {
        var uid = this.generateUid('ref').name;
        var accessedProperty = t.MemberExpression(t.Identifier(uid), property, computed);
        this.addLevel(accessedProperty, uid);
        this.uids.push(uid);
      }
    }]);

    return TransformedTernary;
  }();

  function checkIdxArguments(args) {
    if (args.length !== 2) {
      throw new Error('The `idx` function takes exactly two arguments.');
    }
    var arrowFunction = args[1];
    if (!t.isArrowFunctionExpression(arrowFunction)) {
      throw new Error('The second argument supplied to `idx` must be an arrow function.');
    }
    if (!t.isExpression(arrowFunction.body)) {
      throw new Error('The body of the arrow function supplied to `idx` must be a single ' + 'expression (without curly braces).');
    }
    if (arrowFunction.params.length !== 1) {
      throw new Error('The arrow function supplied to `idx` must take exactly one parameter.');
    }
    var bodyChainBase = getExpressionChainBase(arrowFunction.body);
    if (!t.isIdentifier(arrowFunction.params[0]) || !t.isIdentifier(bodyChainBase) || arrowFunction.params[0].name !== bodyChainBase.name) {
      throw new Error('The parameter of the arrow function supplied to `idx` must match the ' + 'base of the body expression.');
    }
  }

  function getExpressionChainBase(node) {
    if (t.isMemberExpression(node)) {
      return getExpressionChainBase(node.object);
    } else {
      return node;
    }
  }

  function isIdxCall(node) {
    return t.isCallExpression(node) && t.isIdentifier(node.callee) && node.callee.name === 'idx';
  }

  function constructTernary(base, node, generateUid) {
    if (t.isMemberExpression(node)) {
      var transformedObject = constructTernary(base, node.object, generateUid);
      transformedObject.appendPropertyAccess(node.property, node.computed);
      return transformedObject;
    } else {
      return new TransformedTernary(base, generateUid);
    }
  }

  return {
    visitor: {
      CallExpression: function CallExpression(path) {
        var node = path.node;
        if (isIdxCall(node)) {
          checkIdxArguments(node.arguments);
          var ternary = constructTernary(node.arguments[0], node.arguments[1].body, path.scope.generateUidIdentifier.bind(path.scope));
          path.replaceWith(ternary.expression);
          for (var i = 0; i < ternary.uids.length; i++) {
            var uid = ternary.uids[i];
            path.scope.push({ id: t.Identifier(uid) });
          }
        }
      }
    }
  };
};