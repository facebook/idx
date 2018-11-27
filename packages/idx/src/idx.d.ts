/**
 * DeepRequiredArray
 * Nested array condition handler
 */
interface DeepRequiredArray<T> extends Array<DeepRequired<NonNullable<T>>> {}

/**
 * DeepRequiredObject
 * Nested object condition handler
 */
type DeepRequiredObject<T> = {
  [P in keyof T]-?: DeepRequired<NonNullable<T[P]>>
};

/**
 * Function that has deeply required return type
 */
type FunctionWithRequiredReturnType<
  T extends (...args: any[]) => any
> = T extends (...args: infer A) => infer R
  ? (...args: A) => DeepRequired<R>
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
  accessor: (prop: NonNullable<DeepRequired<T1>>) => T2,
): T2 | null | undefined;
export default idx;
