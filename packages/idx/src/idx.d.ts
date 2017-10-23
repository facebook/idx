/**
 * @param { T1 } prop - Parent Object
 * @param { Function } accessor - Accessor function
 * @return { T2 }
 */
export declare function idx<T1, T2>(prop: T1, accessor: (prop: T1) => T2): T2 | null | undefined;
export default idx;
