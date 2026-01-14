import { WithParams } from '@/services/withParams'
import { StandardSchemaV1 } from '@standard-schema/spec'
import { LiteralParam, Param, ParamGetSet, ParamGetter } from '@/types/paramTypes'
import { MakeOptional, UnionToIntersection } from '@/utilities/makeOptional'
import { Identity } from '@/types/utilities'
import { Url } from '@/types/url'

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

type ExtractWithParams<TParts extends Record<string, unknown>> = {
  [K in keyof TParts as TParts[K] extends WithParams ? K : never]: TParts[K] extends WithParams ? TParts[K] : never
}

/**
 * Extracts combined types for any properties that are WithParams, creating a unified parameter object.
 * @template Parts - The route from which to extract and merge parameter types.
 * @returns A record of parameter names to their respective types, extracted and merged from both path and query parameters.
 */
export type ExtractRecordParamTypesReading<TParts extends Record<PropertyKey, unknown>> =
  Identity<
    MakeOptional<
      UnionToIntersection<
        { [K in keyof ExtractWithParams<TParts>]: ExtractParamTypesReading<ExtractWithParams<TParts>[K]> }[keyof ExtractWithParams<TParts>]
      >
    >
  >

/**
 * Extracts combined types of path and query parameters for a given url, creating a unified parameter object.
 * @template TParts - The url from which to extract and merge parameter types.
 * @returns A record of parameter names to their respective types, extracted and merged from both path and query parameters.
 */
export type ExtractUrlParamTypesReading<TParts extends Url> = ExtractRecordParamTypesReading<{ host: TParts['host']['schema'], path: TParts['path']['schema'], query: TParts['query']['schema'], hash: TParts['hash']['schema'] }>

/**
 * Extracts combined types for any properties that are WithParams, creating a unified parameter object.
 * Differs from ExtractRouteParamTypesReading in that optional params with defaults will remain optional.
 * @template TRoute - The route type from which to extract and merge parameter types.
 * @returns A record of parameter names to their respective types, extracted and merged from both path and query parameters.
 */
export type ExtractRecordParamTypesWriting<TParts extends Record<string, unknown>> =
  Identity<
    MakeOptional<
      UnionToIntersection<
        { [K in keyof ExtractWithParams<TParts>]: ExtractParamTypesWriting<ExtractWithParams<TParts>[K]> }[keyof ExtractWithParams<TParts>]
      >
    >
  >

/**
 * Extracts combined types of path and query parameters for a given url, creating a unified parameter object.
 * Differs from ExtractUrlParamTypesReading in that optional params with defaults will remain optional.
 * @template TParts - The url from which to extract and merge parameter types.
 * @returns A record of parameter names to their respective types, extracted and merged from both path and query parameters.
 */
export type ExtractUrlParamTypesWriting<TParts extends Url> = ExtractRecordParamTypesWriting<{ host: TParts['host']['schema'], path: TParts['path']['schema'], query: TParts['query']['schema'], hash: TParts['hash']['schema'] }>

/**
 * Extracts combined types for any properties that are WithParams, creating a unified parameter object.
 * @template TParams - The record of parameter types, possibly including undefined.
 * @returns A new type with the appropriate properties marked as optional.
 */
type ExtractParamTypesReading<TWithParams extends WithParams> = {
  [K in keyof TWithParams['params']]: IsOptionalParamTemplate<K & string, TWithParams['value']> extends true
    ? TWithParams['params'][K] extends Required<ParamGetSet>
      ? ExtractParamType<TWithParams['params'][K]>
      : ExtractParamType<TWithParams['params'][K]> | undefined
    : ExtractParamType<TWithParams['params'][K]>
}

/**
 * Extracts combined types of path and query parameters for a given route, creating a unified parameter object.
 * Differs from ExtractParamTypesReading in that optional params with defaults will remain optional.
 * @template TParams - The record of parameter types, possibly including undefined.
 * @returns A new type with the appropriate properties marked as optional.
 */
type ExtractParamTypesWriting<TWithParams extends WithParams> = {
  [K in keyof TWithParams['params']]: IsOptionalParamTemplate<K & string, TWithParams['value']> extends true
    ? ExtractParamType<TWithParams['params'][K]> | undefined
    : ExtractParamType<TWithParams['params'][K]>
}

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
