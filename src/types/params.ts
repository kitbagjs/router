import { Param, ParamGetSet, ParamGetter } from '@/types/paramTypes'
import { Identity } from '@/types/utilities'

/**
 * Determines if a given value is not a constructor for String, Boolean, Date, or Number.
 * @param value - The value to check.
 * @returns True if the value is not a constructor function for String, Boolean, Date, or Number.
 */
function isNotConstructor(value: Param): boolean {
  return value !== String && value !== Boolean && value !== Number && value !== Date
}

/**
 * Type guard to check if a value conforms to the ParamGetter type.
 * @param value - The value to check.
 * @returns True if the value is a function that is not a constructor.
 */
export function isParamGetter(value: Param): value is ParamGetter {
  return typeof value === 'function' && isNotConstructor(value)
}

/**
 * Type guard to check if a value conforms to the ParamGetSet type.
 * @param value - The value to check.
 * @returns True if the value is an object with both 'get' and 'set' functions defined.
 */
export function isParamGetSet(value: Param): value is ParamGetSet {
  return typeof value === 'object'
    && 'get' in value
    && typeof value.get === 'function'
    && 'set' in value
    && typeof value.set === 'function'
}

/**
 * Extracts the parameter name from a string, handling optional parameters denoted by a leading '?'.
 * @template TParam - The string from which to extract the parameter name.
 * @returns The extracted parameter name, or never if the parameter string is empty.
 */
export type ExtractParamName<
  TParam extends string
> = TParam extends `?${infer Param}`
  ? Param extends ''
    ? never
    : Param
  : TParam extends ''
    ? never
    : TParam

/**
 * Determines the type of a path parameter from a record of parameter types, considering optional parameters.
 * @template TParam - The parameter name string.
 * @template TParams - The record object mapping parameter names to their types.
 * @returns The type associated with the parameter, or StringConstructor if unspecified; may be undefined for optional parameters.
 */
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

/**
 * Transforms a record of parameter types into a type with optional properties where the original type allows undefined.
 * @template TParams - The record of parameter types, possibly including undefined.
 * @returns A new type with the appropriate properties marked as optional.
 */
export type ExtractParamTypes<TParams extends Record<string, Param | undefined>> = Identity<MakeOptional<{
  [K in keyof TParams]: ExtractParamType<TParams[K]>
}>>

/**
 * Extracts the actual type from a parameter type, handling getters, setters, and potential undefined values.
 * @template TParam - The parameter type.
 * @returns The extracted type, or 'string' as a fallback.
 */
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

/**
 * Merges two parameter type records, ensuring no overlap in properties.
 * @template TAlpha - The first record type.
 * @template TBeta - The second record type.
 * @returns A new record type combining properties from both inputs without overlaps.
 */
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
