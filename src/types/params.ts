export type Param<T = any> = {
  get: (value: string) => T,
  set: (value: T) => string,
}
