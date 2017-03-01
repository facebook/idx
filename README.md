# idx

`idx` is a utility function for traversing properties on objects and arrays.

If an intermediate property is either null or undefined, it is instead returned.
The purpose of this function is to simplify extracting properties from a chain
of maybe-typed properties.

## Usage

Consider the following type:

```
const props: {
  user: ?{
    name: string,
    friends: ?Array<User>,
  }
};
```

Getting to the friends of my first friend would resemble:

```
props.user &&
props.user.friends &&
props.user.friends[0] &&
props.user.friends[0].friends
```

Instead, `idx` allows us to safely write:

```
idx(props, _ => _.user.friends[0].friends)
```

The second argument must be a function that returns one or more nested member
expressions. Any other expression has undefined behavior.

## Babel Transform

The `idx` runtime function exists for the purpose of illustrating the expected
behavior and is not meant to be executed. The `idx` function is used in
conjunction with a Babel plugin that replaces it with better performing code:

```
props.user == null ? props.user :
props.user.friends == null ? props.user.friends :
props.user.friends[0] == null ? props.user.friends[0] :
props.user.friends[0].friends
```

All this machinery exists due to the fact that an existential operator does not
currently exist in JavaScript.

## License

`idx` is [BSD licensed](./LICENSE). We also provide an additional
[patent grant](./PATENTS).
