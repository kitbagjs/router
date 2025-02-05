import { LiteralParam, Param, ParamGetSet, ParamGetter } from '@/types/paramTypes'
import { Identity } from '@/types/utilities'
import { MakeOptional } from '@/utilities/makeOptional'
import { ZodSchema } from 'zod'

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
export type ExtractWithParamsParamType<
  TParam extends string,
  TParams extends Record<string, Param | undefined>
> = TParam extends `?${infer OptionalParam}`
  ? OptionalParam extends keyof TParams
    ? TParams[OptionalParam]
    : StringConstructor
  : TParam extends keyof TParams
    ? TParams[TParam]
    : StringConstructor

/**
 * Extracts combined types of path and query parameters for a given route, creating a unified parameter object.
 * This parameter object type represents the expected type when accessing params from router.route or useRoute.
 * @template TRoute - The route type from which to extract and merge parameter types.
 * @returns A record of parameter names to their respective types, extracted and merged from both path and query parameters.
 */
export type ExtractRouteParamTypes<TRoute> = TRoute extends {
  host: { params: infer HostParams extends Record<string, Param> },
  path: { params: infer PathParams extends Record<string, Param> },
  query: { params: infer QueryParams extends Record<string, Param> },
  hash: { params: infer HashParams extends Record<string, Param> },
}
  ? ExtractParamTypes<HostParams & PathParams & QueryParams & HashParams>
  : Record<string, unknown>

/**
 * Extracts combined types of path and query parameters for a given route, creating a unified parameter object.
 * This parameter object type represents the expected type when accessing params from router.route or useRoute.
 * @template TRoute - The route type from which to extract and merge parameter types.
 * @returns A record of parameter names to their respective types, extracted and merged from both path and query parameters.
 */
export type ExtractRouteParamTypesWithOptional<TRoute> = TRoute extends {
  host: { params: infer HostParams extends Record<string, Param> },
  path: { params: infer PathParams extends Record<string, Param> },
  query: { params: infer QueryParams extends Record<string, Param> },
  hash: { params: infer HashParams extends Record<string, Param> },
}
  ? ExtractParamTypesWithOptional<HostParams & PathParams & QueryParams & HashParams>
  : Record<string, unknown>

/**
 * Transforms a record of parameter types into a type with optional properties where the original type allows undefined.
 * @template TParams - The record of parameter types, possibly including undefined.
 * @returns A new type with the appropriate properties marked as optional.
 */
export type ExtractParamTypes<TParams extends Record<string, Param>> = Identity<MakeOptional<{
  [K in keyof TParams as ExtractParamName<K>]: ExtractParamType<TParams[K]>
}>>

/**
 * Transforms a record of parameter types into a type with optional properties where the original type allows undefined.
 * @template TParams - The record of parameter types, possibly including undefined.
 * @returns A new type with the appropriate properties marked as optional.
 */
export type ExtractParamTypesWithOptional<TParams extends Record<string, Param>> = Identity<MakeOptional<{
  [K in keyof TParams as ExtractParamName<K>]: K extends `?${string}`
    ? TParams[K] extends Required<ParamGetSet>
      ? ExtractParamType<TParams[K]>
      : ExtractParamType<TParams[K]> | undefined
    : ExtractParamType<TParams[K]>
}>>

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
      : TParam extends ZodSchema<infer Type>
        ? Type
        : TParam extends LiteralParam
          ? TParam
          : string

type RemoveLeadingQuestionMark<T extends PropertyKey> = T extends `?${infer TRest extends string}` ? TRest : T
export type RemoveLeadingQuestionMarkFromKeys<T extends Record<string, unknown>> = {
  [K in keyof T as RemoveLeadingQuestionMark<K>]: T[K]
}
