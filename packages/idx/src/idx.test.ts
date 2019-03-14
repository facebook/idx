import idx, {IDXOptional} from './idx';

/**
 * Test functions are not run in runtime. They are only type checked with
 * TypeScript compiler
 */
declare function it(description: string, test: () => void): void;

interface Item<T = any> {
  t?: T;
  inner?: {
    item?: string;
  };
}

interface MethodReturnType<T = any> {
  optional?: {member?: Item<T>};
}

interface DeepStructure<T = any> {
  str?: string;
  undef?: undefined;
  null?: null;
  generic?: T;
  arr?: {inner?: string}[];
  foo?: {
    bar?: {
      baz?: {
        arr?: Item<T>[];
      };
    };
  };
  requiredInner?: {
    inner: boolean;
  };
  method?(): MethodReturnType<T>;
  args?(a: string, b: number, c?: boolean): Item<T>;
  requiredReturnType?(): {inner: number};
}

let deep: DeepStructure = {};

it('can access deep properties without null type assertion', () => {
  let str: IDXOptional<string> = idx(deep, _ => _.str);
  let undef: undefined | null = idx(deep, _ => _.undef);
  let null_: undefined | null = idx(deep, _ => _.null);
  let arr: IDXOptional<Item[]> = idx(deep, _ => _.foo.bar.baz.arr);
});

it('can call deep methods without null type assertion', () => {
  let member: IDXOptional<Item> = idx(deep, _ => _.method().optional.member);
  member = idx(deep, _ => _.args('', 1, true));
  member = idx(deep, _ => _.args('', 1));
});

it('can tap into optional structures (array and objects)', () => {
  let str: IDXOptional<string> = idx(
    deep,
    _ => _.foo.bar.baz.arr[0].inner.item,
  );
});

it('returns optional object while maintaining the original type of the object structure', () => {
  let req = idx(deep, _ => _.requiredInner);
  if (req) {
    req.inner.valueOf(); // can safely call because inner is not optional
  }
});

it('returns optional array while maintaining the original type of array item type', () => {
  // inner property type did not become `string | null | undefined`
  let arr: IDXOptional<Array<{inner?: string}>> = idx(deep, _ => _.arr);
});

it('maintains the return type of method calls', () => {
  let req = idx(deep, _ => _.requiredReturnType());
  if (req) {
    req.inner.toFixed(); // can safely call because inner is not optional
  }
});

it('can unbox enums', () => {
  enum Enum {
    ONE = 'ONE',
  }
  type WithEnum = {
    foo?: {
      enum?: Enum;
    };
  };

  let e: IDXOptional<Enum> = idx({} as WithEnum, _ => _.foo.enum);
});

it('can unbox function', () => {
  const returnValue = idx(deep, _ => _.method());
  const control: MethodReturnType = {optional: {}};
  const treatment: typeof returnValue = {optional: {}};
});
