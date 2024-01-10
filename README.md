# idx

**This module is deprecated and no longer maintained. Use [optional chaining](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Operators/Optional_chaining) instead.**

`idx` is a utility function for traversing properties on objects and arrays,
where intermediate properties may be null or undefined.

One notable difference between `idx` and optional chaining is what happens when
an intermediate property is null or undefined. With `idx`, the null or undefined
value is returned, whereas optional chaining would resolve to undefined.

## Install

```shell
$ npm install idx babel-plugin-idx
```

or

```shell
$ yarn add idx babel-plugin-idx
```

[Configure Babel](https://babeljs.io/docs/en/configuration) to include the
`babel-plugin-idx` Babel plugin.

```javascript
{
  plugins: [['babel-plugin-idx']];
}
```

This is necessary for `idx` to behave correctly
with minimal performance impact.

## Usage

Consider the following type for `props`:

```javascript
type User = {
  user: ?{
    name: string,
    friends: ?Array<User>,
  },
};
```

Getting to the friends of my first friend would resemble:

```javascript
props.user &&
  props.user.friends &&
  props.user.friends[0] &&
  props.user.friends[0].friends;
```

Instead, `idx` allows us to safely write:

```javascript
idx(props, _ => _.user.friends[0].friends);
```

The second argument must be a function that returns one or more nested member
expressions. Any other expression has undefined behavior.

## Static Typing

[Flow](https://flow.org/) and [TypeScript](https://www.typescriptlang.org/)
understand the `idx` idiom:

```javascript
// @flow

import idx from 'idx';

function getName(props: User): ?string {
  return idx(props, _ => _.user.name);
}
```

**If you use `idx@3+`,** you may need to add the following to your `.flowconfig`:

```
[options]
conditional_type=true
mapped_type=true
```

## Babel Plugin

The `idx` runtime function exists for the purpose of illustrating the expected
behavior and is not meant to be executed. The `idx` function requires the use of
a Babel plugin that replaces it with an implementation that does not depend on
details related to browser error messages.

This Babel plugin searches for requires or imports to the `idx` module and
replaces all its usages, so this code:

```javascript
import idx from 'idx';

function getFriends() {
  return idx(props, _ => _.user.friends[0].friends);
}
```

gets transformed to something like:

```javascript
function getFriends() {
  return props.user == null
    ? props.user
    : props.user.friends == null
    ? props.user.friends
    : props.user.friends[0] == null
    ? props.user.friends[0]
    : props.user.friends[0].friends;
}
```

Note that the original `import` gets also removed.

It's possible to customize the name of the import/require, so code that is not
directly requiring the `idx` npm package can also get transformed:

```javascript
{
  plugins: [
    [
      'babel-plugin-idx',
      {
        importName: './idx',
      },
    ],
  ];
}
```

## License

`idx` is [MIT licensed](./LICENSE).
