export type ParamExtras = {
  invalid: (message?: string) => never,
}

export type ParamGetter<T = any> = (value: string, extras: ParamExtras) => T
export type ParamSetter<T = any> = (value: T, extras: ParamExtras) => string

export type ParamGetSet<T = any> = {
  get: ParamGetter<T>,
  set: ParamSetter<T>,
}

export type Param = ParamGetter | ParamGetSet | RegExp | BooleanConstructor | NumberConstructor

export type ParamReturn<T extends Param> =
T extends BooleanConstructor ? boolean
  : T extends NumberConstructor ? number
    : T extends ParamGetter<infer TReturn> ? TReturn
      : T extends ParamGetSet<infer TReturn> ? TReturn
        : string

export function isParamGetter(value: Param): value is ParamGetter {
  return typeof value === 'function' && value !== Boolean && value !== Number
}

export function isParamGetSet(value: Param): value is ParamGetSet {
  return typeof value === 'object'
    && 'get' in value
    && typeof value.get === 'function'
    && 'set' in value
    && typeof value.set === 'function'
}