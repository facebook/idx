/**
 * NonUndefinedOrnNull
 * Exclude undefined and null from set `A`
 */
type NonUndefinedOrnNull<T> = T extends (undefined | null) ? never : T;

/**
 * DeepRequiredArray
 * Nested array condition handler
 */
interface DeepRequiredArray<T>
  extends Array<DeepRequired<NonUndefinedOrnNull<T>>> {}

/**
 * DeepRequiredObject
 * Nested object condition handler
 */
type DeepRequiredObject<T> = {
  [P in keyof T]-?: DeepRequired<NonUndefinedOrnNull<T[P]>>
};

/**
 * Function that has deeply required return type
 */
type FunctionWithRequiredReturnType<
  T extends (...args: any[]) => any
> = T extends FunctionWithRequiredReturnType_RestArgs<T>
  ? FunctionWithRequiredReturnType_RestArgs<T>
  : T extends FunctionWithRequiredReturnType_Args1<T>
    ? FunctionWithRequiredReturnType_Args1<T>
    : T extends FunctionWithRequiredReturnType_Args2<T>
      ? FunctionWithRequiredReturnType_Args2<T>
      : T extends FunctionWithRequiredReturnType_Args3<T>
        ? FunctionWithRequiredReturnType_Args3<T>
        : T extends FunctionWithRequiredReturnType_Args4<T>
          ? FunctionWithRequiredReturnType_Args4<T>
          : T extends FunctionWithRequiredReturnType_Args5<T>
            ? FunctionWithRequiredReturnType_Args5<T>
            : T extends FunctionWithRequiredReturnType_Args6<T>
              ? FunctionWithRequiredReturnType_Args6<T>
              : T extends FunctionWithRequiredReturnType_Args7<T>
                ? FunctionWithRequiredReturnType_Args7<T>
                : T extends FunctionWithRequiredReturnType_NoArgs<T>
                  ? FunctionWithRequiredReturnType_NoArgs<T>
                  : FunctionWithRequiredReturnType_AnyArgs<T>;

/**
 * Function that has deeply required return type with no arguments
 */
type FunctionWithRequiredReturnType_AnyArgs<
  T extends (...args: any[]) => any
> = T extends (...args: any[]) => infer R
  ? (...args: any[]) => DeepRequired<R>
  : never;

/**
 * Function that has deeply required return type with rest argument
 */
type FunctionWithRequiredReturnType_RestArgs<
  T extends (...args: any[]) => any
> = T extends (...args: infer A) => infer R
  ? (...args: A) => DeepRequired<R>
  : never;

/**
 * Function that has deeply required return type with no arguments
 */
type FunctionWithRequiredReturnType_NoArgs<
  T extends () => any
> = T extends () => infer R ? () => DeepRequired<R> : never;

/**
 * Function that has deeply required return type with 1 argument
 */
type FunctionWithRequiredReturnType_Args1<
  T extends (arg: any) => any
> = T extends (a: infer A) => infer R ? (a: A) => DeepRequired<R> : never;

/**
 * Function that has deeply required return type with 2 arguments
 */
type FunctionWithRequiredReturnType_Args2<
  T extends (arg: any) => any
> = T extends (a: infer A, b: infer B) => infer R
  ? (a: A, b: B) => DeepRequired<R>
  : never;

/**
 * Function that has deeply required return type with 3 arguments
 */
type FunctionWithRequiredReturnType_Args3<
  T extends (arg: any) => any
> = T extends (a: infer A, b: infer B, c: infer C) => infer R
  ? (a: A, b: B, c: C) => DeepRequired<R>
  : never;

/**
 * Function that has deeply required return type with 4 arguments
 */
type FunctionWithRequiredReturnType_Args4<
  T extends (arg: any) => any
> = T extends (a: infer A, b: infer B, c: infer C, d: infer D) => infer R
  ? (a: A, b: B, c: C, d: D) => DeepRequired<R>
  : never;

/**
 * Function that has deeply required return type with 5 arguments
 */
type FunctionWithRequiredReturnType_Args5<
  T extends (arg: any) => any
> = T extends (
  a: infer A,
  b: infer B,
  c: infer C,
  d: infer D,
  e: infer E,
) => infer R
  ? (a: A, b: B, c: C, d: D, e: E) => DeepRequired<R>
  : never;

/**
 * Function that has deeply required return type with 6 arguments
 */
type FunctionWithRequiredReturnType_Args6<
  T extends (arg: any) => any
> = T extends (
  a: infer A,
  b: infer B,
  c: infer C,
  d: infer D,
  e: infer E,
  f: infer F,
) => infer R
  ? (a: A, b: B, c: C, d: D, e: E, f: F) => DeepRequired<R>
  : never;

/**
 * Function that has deeply required return type with 7 arguments
 */
type FunctionWithRequiredReturnType_Args7<
  T extends (arg: any) => any
> = T extends (
  a: infer A,
  b: infer B,
  c: infer C,
  d: infer D,
  e: infer E,
  f: infer F,
  g: infer G,
) => infer R
  ? (a: A, b: B, c: C, d: D, e: E, f: F, g: G) => DeepRequired<R>
  : never;

/**
 * DeepRequired
 * Required that works for deeply nested structure
 */
type DeepRequired<T> = T extends any[]
  ? DeepRequiredArray<T[number]>
  : T extends (...args: any[]) => any
    ? FunctionWithRequiredReturnType<T>
    : T extends object ? DeepRequiredObject<T> : T;

/**
 * Traverses properties on objects and arrays. If an intermediate property is
 * either null or undefined, it is instead returned. The purpose of this method
 * is to simplify extracting properties from a chain of maybe-typed properties.
 *
 * Consider the following type:
 *
 *     const props: {
 *       user?: {
 *         name: string,
 *         friends?: Array<User>,
 *       }
 *     };
 *
 * Getting to the friends of my first friend would resemble:
 *
 *      props.user &&
 *      props.user.friends &&
 *      props.user.friends[0] &&
 *      props.user.friends[0].friends
 *
 * Instead, `idx` allows us to safely write:
 *
 *      idx(props, _ => _.user.friends[0].friends)
 *
 * The second argument must be a function that returns one or more nested member
 * expressions. Any other expression has undefined behavior.
 *
 * @param prop - Parent object
 * @param accessor - Accessor function
 * @return the property accessed if accessor function could reach to property,
 * null or undefined otherwise
 */
declare function idx<T1, T2>(
  prop: T1,
  accessor: (prop: DeepRequired<T1>) => T2,
): T2 | null | undefined;
export default idx;
