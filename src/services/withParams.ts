import { getParamsForString } from '@/services/getParamsForString'
import { ExtractParamName, ParamEnd, ParamIsGreedy, ParamIsOptional, ParamStart } from '@/types/params'
import { Param } from '@/types/paramTypes'
import { QuerySource } from '@/types/querySource'
import { Identity } from '@/types/utilities'
import { isRecord } from '@/utilities/guards'
import { MakeOptional } from '@/utilities/makeOptional'

type WithParamsParamsInput<
  TValue extends string
> = TValue extends `${string}${ParamStart}${infer TParam}${ParamEnd}${infer Rest}`
  ? Record<ExtractParamName<TParam>, Param | undefined> & WithParamsParamsInput<Rest>
  : {}

type WithParamsParamsOutput<
  TValue extends string,
  TParams extends Record<string, Param | undefined> = Record<never, never>
> = TValue extends `${string}${ParamStart}${infer TParam}${ParamEnd}${infer Rest}`
  ? ExtractParamName<TParam> extends keyof TParams
    ? TParams[ExtractParamName<TParam>] extends Param
      ? Record<ExtractParamName<TParam>, { param: TParams[ExtractParamName<TParam>], isOptional: ParamIsOptional<TParam>, isGreedy: ParamIsGreedy<TParam> }> & WithParamsParamsOutput<Rest, TParams>
      : Record<ExtractParamName<TParam>, { param: StringConstructor, isOptional: ParamIsOptional<TParam>, isGreedy: ParamIsGreedy<TParam> }> & WithParamsParamsOutput<Rest, TParams>
    : Record<ExtractParamName<TParam>, { param: StringConstructor, isOptional: ParamIsOptional<TParam>, isGreedy: ParamIsGreedy<TParam> }> & WithParamsParamsOutput<Rest, TParams>
  : {}

const UrlPartsWithParamsSymbol = Symbol('UrlPartsWithParams')

export type UrlParam<TParam extends Param = Param> = { param: TParam, isOptional: boolean, isGreedy: boolean }
export type RequiredUrlParam<TParam extends Param = Param> = { param: TParam, isOptional: false, isGreedy: false }
export type OptionalUrlParam<TParam extends Param = Param> = { param: TParam, isOptional: true, isGreedy: false }
export type UrlParams = Record<string, UrlParam>

export type UrlPart<TParams extends UrlParams = UrlParams> = {
  value: string,
  params: TParams,
  [UrlPartsWithParamsSymbol]: true,
}

export type ToUrlPart<T extends string | UrlPart | undefined> = T extends string
  ? UrlPart<WithParamsParamsOutput<T>>
  : T extends undefined
    ? UrlPart<{}>
    : unknown extends T
      ? UrlPart<{}>
      : T

function isUrlPart(maybeUrlPartsWithParams: unknown): maybeUrlPartsWithParams is UrlPart {
  return isRecord(maybeUrlPartsWithParams) && maybeUrlPartsWithParams[UrlPartsWithParamsSymbol] === true
}

export function toUrlPart<T extends string | UrlPart | undefined>(value: T): ToUrlPart<T>
export function toUrlPart<T extends string | UrlPart | undefined>(value: T): UrlPart {
  if (value === undefined) {
    return withParams()
  }

  if (isUrlPart(value)) {
    return value
  }

  return withParams(value, {})
}

export function withParams<
  const TValue extends string,
  const TParams extends MakeOptional<WithParamsParamsInput<TValue>>
>(value: TValue, params: TParams): UrlPart<WithParamsParamsOutput<TValue, TParams>>
export function withParams(): UrlPart<{}>
export function withParams(value?: string, params?: Record<string, Param | undefined>): UrlPart {
  return {
    value: value ?? '',
    params: getParamsForString(value, params),
    [UrlPartsWithParamsSymbol]: true,
  }
}

/**
 * Type for query source that can be converted to a UrlPart object.
 * Supports
 * { query: 'foo=bar' }
 * { query: 'foo=[bar]' }
 * { query: { foo: 'bar' } }
 * { query: [['foo', 'bar']] }
 * { query: { foo: Param } }
 * { query: [[ 'foo', Param ]] }
*/
export type QuerySourceOrUrlPart = QuerySource | UrlPart | undefined | Record<string, Param> | [string, Param][]
export type QuerySourceToUrlPart<T extends QuerySourceOrUrlPart> = T extends string
  ? UrlPart<WithParamsParamsOutput<T>>
  : T extends UrlPart
    ? T
    : T extends undefined
      ? UrlPart<{}>
      : T extends Record<string, string | Param>
        ? UrlPart<QueryRecordToUrlPart<T>>
        : T extends [string, string | Param][]
          ? UrlPart<QueryArrayToUrlPart<T>>
          : UrlPart<{}>

type QueryRecordToUrlPart<T extends Record<string, Param>> = {
  [K in keyof T as T[K] extends string ? never : K]: { param: T[K], isOptional: false, isGreedy: false }
}

type QueryArrayToUrlPart<T extends [string, string | Param][]> = T extends [infer First extends [string, string | Param], ...infer Rest extends [string, string | Param][]]
  ? First extends [string, string]
    ? {}
    : First extends [infer TKey extends string, infer TValue extends Param]
      ? Identity<Record<TKey, { param: TValue, isOptional: false, isGreedy: false }> & QueryArrayToUrlPart<Rest>>
      : never
  : {}

export function querySourceToUrlPart<T extends QuerySourceOrUrlPart>(querySource: T): QuerySourceToUrlPart<T>
export function querySourceToUrlPart(querySource: QuerySourceOrUrlPart): UrlPart {
  if (typeof querySource === 'string' || typeof querySource === 'undefined' || isUrlPartsWithParams(querySource)) {
    return toUrlPart(querySource)
  }

  const entries = Array.isArray(querySource) ? querySource : Object.entries(querySource)
  const source: string[] = []
  const params: Record<string, Param> = {}

  for (const [key, value] of entries) {
    if (typeof value === 'string') {
      source.push(`${key}=${value}`)
    } else {
      params[key] = value
      source.push(`${key}=[${key}]`)
    }
  }

  return withParams(source.join('&'), params)
}
