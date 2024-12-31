// Utility type that converts types like `{ foo: string } & { bar: string, baz: never }`
// into `{ foo: string, bar: string }`
//
// this is a magic type and don't wanna mess with the {}
export type Identity<T> = T extends object ? {} & {
  [P in keyof T as T[P] extends never ? never : P]: T[P]
} : T

export type IsAny<T> = 0 extends (1 & T) ? true : false

export type IsEmptyObject<T> = T extends Record<string, never> ? (keyof T extends never ? true : false) : false

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

export type OnlyRequiredProperties<T> = {
  [K in keyof T as Extract<T[K], undefined> extends never ? K : never]: T[K]
}

export type AllPropertiesAreOptional<T> = Record<string, unknown> extends T
  ? true
  : IsEmptyObject<OnlyRequiredProperties<T>>

/**
 * Converts a type to a string if it is a string, otherwise returns never.
 * Specifically useful when using keyof T to produce a union of strings
 * rather than string | number | symbol.
 */
export type AsString<T> = T extends string ? T : never

/**
 * Extracts the keys of a union type.
 */
export type KeysOfUnion<T> = T extends T ? keyof T : never
