import { LiteralParam, Param, ParamGetSet, ParamGetter } from '@/types/paramTypes'
import { StandardSchemaV1 } from '@standard-schema/spec'

export const paramStart = '['
export type ParamStart = typeof paramStart
export const paramEnd = ']'
export type ParamEnd = typeof paramEnd

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
 * Type guard to check if a value conforms to the LiteralParam type.
 * @param value - The value to check.
 * @returns True if the value is a string, number, or boolean.
 */
export function isLiteralParam(value: Param): value is LiteralParam {
  return typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean'
}

/**
 * Determines if a given value is an optional parameter template.
 * @template TKey - The key of the parameter.
 * @template TValue - The value of the parameter.
 * @returns True if the value is an optional parameter template.
 */
export type IsOptionalParamTemplate<TKey extends string, TValue extends string> = TValue extends `${string}${ParamStart}?${TKey}${ParamEnd}${string}`
  ? true
  : false

/**
 * Extracts the parameter name from a string, handling optional parameters denoted by a leading '?'.
 * @template TParam - The string from which to extract the parameter name.
 * @returns The extracted parameter name, or never if the parameter string is empty.
 */
export type ExtractParamName<
  TParam extends PropertyKey
> = TParam extends string
  ? TParam extends `?${infer Param}`
    ? Param extends ''
      ? never
      : Param
    : TParam extends ''
      ? never
      : TParam
  : never

/**
 * Extracts the actual type from a parameter type, handling getters and setters.
 * @template TParam - The parameter type.
 * @returns The extracted type, or 'string' as a fallback.
 */
export type ExtractParamType<TParam extends Param> =
Param extends TParam
  ? unknown
  : TParam extends ParamGetSet<infer Type>
    ? Type
    : TParam extends ParamGetter
      ? ReturnType<TParam>
      : TParam extends StandardSchemaV1
        ? StandardSchemaV1.InferOutput<TParam>
        : TParam extends LiteralParam
          ? TParam
          : string
