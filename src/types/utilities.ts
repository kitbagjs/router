// Utility type that converts types like `{ foo: string } & { bar: string }`
// into `{ foo: string, bar: string }`
//
// this is a magic type and don't wanna mess with the {}
// eslint-disable-next-line @typescript-eslint/ban-types
export type Identity<T> = T extends object ? {} & {
  [P in keyof T]: T[P]
} : T

export type IsAny<T> = 0 extends (1 & T) ? true : false

// Returns true if all values in a tuple could be undefined like `[string | undefined, boolean | undefined]`
export type TupleCanBeAllUndefined<T extends unknown[]> = T extends [infer First, ...infer Rest]
  ? undefined extends First
    ? TupleCanBeAllUndefined<Rest>
    : false
  : true

export type IsEmptyObject<T> = T extends Record<string, never> ? (keyof T extends never ? true : false) : false