// Utility type that converts types like `{ foo: string } & { bar: string, baz: never }`
// into `{ foo: string, bar: string }`
//
// this is a magic type and don't wanna mess with the {}
export type Identity<T> = T extends object ? {} & {
  [P in keyof T as T[P] extends never ? never : P]: T[P]
} : T

type IsEmptyObject<T> = T extends Record<string, never> ? (keyof T extends never ? true : false) : false

export type LastInArray<T, TFallback = never> = T extends [...any[], infer Last] ? Last : TFallback

export type MaybePromise<T> = T | Promise<T>

type OnlyRequiredProperties<T> = {
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

export type Entries<T> = {
  [K in keyof T]: [K, T[K]]
}[keyof T]

export type UnionToIntersection<U> =
  (U extends any ? (k: U) => void : never) extends ((k: infer I) => void) ? I : never

export type LastOf<T> =
  UnionToIntersection<T extends any ? () => T : never> extends () => infer R ? R : never

export type UnionToTuple<T, L = LastOf<T>, N = [T] extends [never] ? true : false> =
  true extends N ? [] : [...UnionToTuple<Exclude<T, L>>, L]
