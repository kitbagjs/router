import { ZodSchemaLike } from '@/services/zod'
import { LiteralParam, Param, ParamGetSet, ParamGetter } from '@/types/paramTypes'
import { Identity } from '@/types/utilities'
import { MakeOptional } from '@/utilities/makeOptional'
import { Route } from './route'
import { WithParams } from '@/services/withParams'
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
 * Extracts combined types of path and query parameters for a given route, creating a unified parameter object.
 * @template TRoute - The route type from which to extract and merge parameter types.
 * @returns A record of parameter names to their respective types, extracted and merged from both path and query parameters.
 */
export type ExtractRouteParamTypesReading<TRoute extends Route> =
  Identity<MakeOptional<ExtractParamTypesReading<TRoute['host']> & ExtractParamTypesReading<TRoute['path']> & ExtractParamTypesReading<TRoute['query']> & ExtractParamTypesReading<TRoute['hash']>>>

/**
 * Extracts combined types of path and query parameters for a given route, creating a unified parameter object.
 * Differs from ExtractRouteParamTypesReading in that optional params with defaults will remain optional.
 * @template TRoute - The route type from which to extract and merge parameter types.
 * @returns A record of parameter names to their respective types, extracted and merged from both path and query parameters.
 */
export type ExtractRouteParamTypesWriting<TRoute extends Route> =
  Identity<MakeOptional<ExtractParamTypesWriting<TRoute['host']> & ExtractParamTypesWriting<TRoute['path']> & ExtractParamTypesWriting<TRoute['query']> & ExtractParamTypesWriting<TRoute['hash']>>>

/**
 * Extracts combined types of path and query parameters for a given route, creating a unified parameter object.
 * @template TParams - The record of parameter types, possibly including undefined.
 * @returns A new type with the appropriate properties marked as optional.
 */
export type ExtractParamTypesReading<TWithParams extends WithParams> = {
  [K in keyof TWithParams['params']]: TWithParams['value'] extends `${string}${ParamStart}?${K & string}${ParamEnd}${string}`
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
export type ExtractParamTypesWriting<TWithParams extends WithParams> = {
  [K in keyof TWithParams['params']]: TWithParams['value'] extends `${string}${ParamStart}?${K & string}${ParamEnd}${string}`
    ? ExtractParamType<TWithParams['params'][K]> | undefined
    : ExtractParamType<TWithParams['params'][K]>
}

/**
 * Extracts the actual type from a parameter type, handling getters and setters.
 * @template TParam - The parameter type.
 * @returns The extracted type, or 'string' as a fallback.
 */
export type ExtractParamType<TParam extends Param> =
  TParam extends ParamGetSet<infer Type>
    ? Type
    : TParam extends ParamGetter
      ? ReturnType<TParam>
      : TParam extends ZodSchemaLike<infer Type>
        ? Type
        : TParam extends StandardSchemaV1
          ? StandardSchemaV1.InferOutput<TParam>
          : TParam extends LiteralParam
            ? TParam
            : string
