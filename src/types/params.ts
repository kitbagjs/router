import { Identity } from '@/types/utilities'

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
    ? TParams[OptionalParam] | undefined
    : StringConstructor | undefined
  : TParam extends keyof TParams
    ? TParams[TParam]
    : StringConstructor

export type ExtractParamTypes<TParams extends Record<string, Param | undefined>> = Identity<MakeOptional<{
  [K in keyof TParams]: ExtractParamType<TParams[K]>
}>>

export type ExtractParamType<TParam extends Param | undefined> = TParam extends ParamGetSet<infer Type>
  ? undefined extends TParam
    ? Type | undefined
    : Type
  : TParam extends ParamGetter
    ? undefined extends TParam
      ? ReturnType<TParam> | undefined
      : ReturnType<TParam>
    : undefined extends TParam
      ? undefined
      : string

type WithOptionalProperties<T> = {
  [P in keyof T]-?: undefined extends T[P] ? P : never
}[keyof T]

type MakeOptional<T> = {
  [P in WithOptionalProperties<T>]?: T[P];
} & {
  [P in Exclude<keyof T, WithOptionalProperties<T>>]: T[P];
}

export type MergeParams<
  TAlpha extends Record<string, unknown>,
  TBeta extends Record<string, unknown>
> = {
  [K in keyof TAlpha | keyof TBeta]: K extends keyof TAlpha & keyof TBeta
    ? never
    : K extends keyof TAlpha
      ? TAlpha[K]
      : K extends keyof TBeta
        ? TBeta[K]
        : never
}