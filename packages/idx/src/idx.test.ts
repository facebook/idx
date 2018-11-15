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

let baz: string | null | undefined = idx(nullable, _ => _.foo.bar.baz);
