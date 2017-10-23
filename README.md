# idx [![Circle Status](https://circleci.com/gh/facebookincubator/idx/tree/master.svg?style=shield&circle-token=da61f3cf105f22309c8ca0ba4482daa538bf5349)](https://circleci.com/gh/facebookincubator/idx)

`idx` is a utility function for traversing properties on objects and arrays.

If an intermediate property is either null or undefined, it is instead returned.
The purpose of this function is to simplify extracting properties from a chain
of maybe-typed properties.

This module exists as a stop-gap solution because JavaScript does not currently
support [optional chaining](https://github.com/tc39/proposal-optional-chaining).

## Usage

Consider the following type for `props`:

```javascript
type User = {
  user: ?{
    name: string,
    friends: ?Array<User>,
  }
};
```

Getting to the friends of my first friend would resemble:

```javascript
props.user &&
props.user.friends &&
props.user.friends[0] &&
props.user.friends[0].friends
```

Instead, `idx` allows us to safely write:

```javascript
idx(props, _ => _.user.friends[0].friends)
```

The second argument must be a function that returns one or more nested member
expressions. Any other expression has undefined behavior.

## Flow Type

[Flow](https://flow.org/) understands the `idx` idiom:

```javascript
// @flow

import idx from 'idx';

function getName(props: User): ?string {
  return idx(props, _ => _.user.name);
}
```

## Babel Transform

The `idx` runtime function exists for the purpose of illustrating the expected
behavior and is not meant to be executed. The `idx` function is used in
conjunction with a Babel plugin that replaces it with better performing code.

This babel plugin searches for requires or imports to the `idx` module and
replaces all its usages, so this code:

```javascript
import idx from 'idx';

function getFriends() {
  return idx(props, _ => _.user.friends[0].friends)
};
```

gets transformed to something like:

```javascript
function getFriends() {
  props.user == null ? props.user :
  props.user.friends == null ? props.user.friends :
  props.user.friends[0] == null ? props.user.friends[0] :
  return props.user.friends[0].friends
}
```

(note that the original `import` gets also removed).

It's possible to customize the name of the import/require, so code that is not
directly requiring the `idx` npm package can also get transformed:

```javascript
{
  plugins: [
    ["babel-plugin-idx", {
      importName: './idx',
    }]
  ]
}
```

## License

`idx` is [MIT licensed](./LICENSE).
