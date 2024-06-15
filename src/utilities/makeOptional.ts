type WithOptionalProperties<T> = {
  [P in keyof T]-?: undefined extends T[P] ? P : never
}[keyof T]

export type MakeOptional<T> = {
  [P in WithOptionalProperties<T>]?: T[P];
} & {
  [P in Exclude<keyof T, WithOptionalProperties<T>>]: T[P];
}