export type ParamGetter<T = any> = (value: string) => T

export type Param<T = any> = {
  get: ParamGetter<T>,
  set: (value: T) => string,
}