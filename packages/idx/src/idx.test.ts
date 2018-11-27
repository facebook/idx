import idx from './idx';

interface DeepStructure {
  foo?: {
    bar?: {
      baz?: {
        arr?: Array<{
          inner?: {
            item?: string;
          };
        }>;
      };
    };
  };
}

let deep: DeepStructure = {} as any;

let item: string | undefined | null = idx(
  deep,
  _ => _.foo.bar.baz.arr[0].inner.item,
);

let baz = idx(deep, _ => _.foo.bar.baz);
item = idx(baz, _ => _.arr[0].inner.item);

let listOfDeep: DeepStructure[] = [];

item = idx(listOfDeep, _ => _[0].foo.bar.baz.arr[0].inner.item);

interface NullableStructure {
  foo: {
    bar: {
      baz: string | null;
    } | null;
  } | null;
}

let nullable: NullableStructure = {} as any;

let bazz: string | null | undefined = idx(nullable, _ => _.foo.bar.baz);

interface WithMethods<T = any> {
  foo?: {
    bar?(): number;
  };
  baz?: {
    fn?(): {inner?: string};
  };
  args?(a: number): number;
  manyArgs?(
    a: number,
    b: string,
    c: boolean,
    d: number,
    e: number,
    f: number,
    g: string,
    h: string,
    k: number,
    l: boolean,
    m: string,
  ): number;
  restArgs?(...args: string[]): string;
  genrric?(arg: T): T;
}

let withMethods: WithMethods<boolean> = {} as any;

let n: number | undefined | null = idx(withMethods, _ => _.foo.bar());
n = idx(withMethods, _ => _.args(1));
n = idx(withMethods, _ =>
  _.manyArgs(1, 'b', true, 1, 2, 3, '4', '5', 1, true, ''),
);
let s: string | undefined | null = idx(withMethods, _ => _.baz.fn().inner);
s = idx(withMethods, _ => _.restArgs('1', '2', '3', '4', '5', '6'));
let b: boolean | undefined | null = idx(withMethods, _ => _.genrric(true));
