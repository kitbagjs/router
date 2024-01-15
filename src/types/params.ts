export type ParamExtras = {
  invalid: (message?: string) => never,
}

export type ParamGetter<T = any> = (value: string, extras: ParamExtras) => T
export type ParamSetter<T = any> = (value: T, extras: ParamExtras) => string

export type ParamGetSet<T = any> = {
  get: ParamGetter<T>,
  set: ParamSetter<T>,
}

export type Param = ParamGetter | ParamGetSet | RegExp | BooleanConstructor | NumberConstructor | StringConstructor

function isNotConstructor(value: Param): boolean {
  return value !== String && value !== Boolean && value !== Number
}

export function isParamGetter(value: Param): value is ParamGetter {
  return typeof value === 'function' && isNotConstructor(value)
}

export function isParamGetSet(value: Param): value is ParamGetSet {
  return typeof value === 'object'
    && 'get' in value
    && typeof value.get === 'function'
    && 'set' in value
    && typeof value.set === 'function'
}

export type ExtractParamName<
  TParam extends string
> = TParam extends `?${infer Param}`
  ? Param extends ''
    ? never
    : Param
  : TParam extends ''
    ? never
    : TParam

export type ExtractPathParamType<
  TParam extends string,
  TParams extends Record<string, Param | undefined>
> = TParam extends `?${infer OptionalParam}`
  ? OptionalParam extends keyof TParams
    ? ExtractParamType<TParams[OptionalParam]> | undefined
    : string | undefined
  : TParam extends keyof TParams
    ? ExtractParamType<TParams[TParam]>
    : string

export type ExtractParamType<TParam extends Param | undefined> = TParam extends ParamGetSet<infer Type>
  ? Type
  : TParam extends ParamGetter
    ? ReturnType<TParam>
    : string