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
