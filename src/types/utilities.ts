// Utility type that converts types like `{ foo: string } & { bar: string, baz: never }`
// into `{ foo: string, bar: string }`
//
// this is a magic type and don't wanna mess with the {}
// eslint-disable-next-line @typescript-eslint/ban-types
export type Identity<T> = T extends object ? {} & {
  [P in keyof T as T[P] extends never ? never : P]: T[P]
} : T

export type IsAny<T> = 0 extends (1 & T) ? true : false

// Returns true if all values in a tuple could be undefined like `[string | undefined, boolean | undefined]`
export type TupleCanBeAllUndefined<T extends unknown[]> = T extends [infer First, ...infer Rest]
  ? undefined extends First
    ? TupleCanBeAllUndefined<Rest>
    : false
  : true

export type IsEmptyObject<T> = T extends Record<string, never> ? (keyof T extends never ? true : false) : false

// Copied from [type-fest](https://github.com/sindresorhus/type-fest/blob/main/source/union-to-intersection.d.ts)
export type UnionToIntersection<Union> = (
  // `extends unknown` is always going to be the case and is used to convert the
  // `Union` into a [distributive conditional
  // type](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-2-8.html#distributive-conditional-types).
  Union extends unknown
    // The union type is used as the only argument to a function since the union
    // of function arguments is an intersection.
    ? (distributedUnion: Union) => void
    // This won't happen.
    : never
// Infer the `Intersection` type since TypeScript represents the positional
// arguments of unions of functions as an intersection of the union.
) extends ((mergedIntersection: infer Intersection) => void)
  // The `& Union` is to allow indexing by the resulting type
  ? Intersection & Union
  : never

export type MaybeLazy<T> = T | (() => Promise<T>)

export type MaybeArray<T> = T | T[]

export type MaybePromise<T> = T | Promise<T>

// Copied and modified from [type-fest](https://github.com/sindresorhus/type-fest/blob/main/source/replace.d.ts)
export type ReplaceAll<
  Input extends string,
  Search extends string,
  Replacement extends string
> = Input extends `${infer Head}${Search}${infer Tail}`
  ? `${Head}${Replacement}${ReplaceAll<Tail, Search, Replacement>}`
  : Input

export type Thenable<T> = T & PromiseLike<T>