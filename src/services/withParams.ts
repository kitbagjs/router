import { getParamsForString } from '@/services/getParamsForString'
import { getParamName } from '@/services/routeRegex'
import { ExtractParamName, isLiteralParam, ParamEnd, ParamIsGreedy, ParamIsOptionalOrHasDefault, ParamStart } from '@/types/params'
import { ParamOptions } from '@/types/paramTypes'
import { Identity } from '@/types/utilities'
import { isRecord } from '@/utilities/guards'
import { MakeOptional } from '@/utilities/makeOptional'

type WithParamsParamsInput<
  TValue extends string
> = TValue extends `${string}${ParamStart}${infer TParam}${ParamEnd}${infer Rest}`
  ? Record<ExtractParamName<TParam>, ParamOptions | undefined> & WithParamsParamsInput<Rest>
  : {}

type WithParamsParamsOutput<
  TValue extends string,
  TParamOptions extends Record<string, ParamOptions | undefined> = Record<never, never>
> = TValue extends `${string}${ParamStart}${infer TParam}${ParamEnd}${infer Rest}`
  ? ExtractParamName<TParam> extends keyof TParamOptions
    ? TParamOptions[ExtractParamName<TParam>] extends ParamOptions
      ? Record<ExtractParamName<TParam>, { param: TParamOptions[ExtractParamName<TParam>], isOptional: ParamIsOptionalOrHasDefault<TParam, TParamOptions[ExtractParamName<TParam>]>, isGreedy: ParamIsGreedy<TParam> }> & WithParamsParamsOutput<Rest, TParamOptions>
      : Record<ExtractParamName<TParam>, { param: StringConstructor, isOptional: ParamIsOptionalOrHasDefault<TParam, TParamOptions[ExtractParamName<TParam>]>, isGreedy: ParamIsGreedy<TParam> }> & WithParamsParamsOutput<Rest, TParamOptions>
    : Record<ExtractParamName<TParam>, { param: StringConstructor, isOptional: ParamIsOptionalOrHasDefault<TParam, TParamOptions[ExtractParamName<TParam>]>, isGreedy: ParamIsGreedy<TParam> }> & WithParamsParamsOutput<Rest, TParamOptions>
  : {}

const UrlPartsWithParamsSymbol = Symbol('UrlPartsWithParams')

export type UrlParam<TParamOptions extends ParamOptions = ParamOptions> = { param: TParamOptions, isOptional: boolean, isGreedy: boolean }
export type RequiredUrlParam<TParamOptions extends ParamOptions = ParamOptions> = { param: TParamOptions, isOptional: false, isGreedy: false }
export type OptionalUrlParam<TParamOptions extends ParamOptions = ParamOptions> = { param: TParamOptions, isOptional: true, isGreedy: false }
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
  const TParamOptions extends MakeOptional<WithParamsParamsInput<TValue>>
>(value: TValue, params: TParamOptions): UrlPart<WithParamsParamsOutput<TValue, TParamOptions>>
export function withParams(): UrlPart<{}>
export function withParams(value?: string, params?: Record<string, ParamOptions | undefined>): UrlPart {
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
 * { query: { foo: ParamOptions } }
 * { query: [[ 'foo', ParamOptions ]] }
*/
export type UrlQueryPart = UrlPart | Record<string, ParamOptions> | [string, ParamOptions][]
export type ToUrlQueryPart<T extends UrlQueryPart | string | undefined> = T extends string
  ? UrlPart<WithParamsParamsOutput<T>>
  : T extends UrlPart
    ? T
    : T extends undefined
      ? UrlPart<{}>
      : T extends Record<string, string | ParamOptions>
        ? UrlPart<QueryRecordToUrlPart<T>>
        : T extends [string, string | ParamOptions][]
          ? UrlPart<QueryArrayToUrlPart<T>>
          : UrlPart<{}>

type QueryRecordToUrlPart<TParamOptions extends Record<string, ParamOptions>> = {
  [K in keyof TParamOptions as TParamOptions[K] extends string ? never : ExtractParamName<K & string>]: { param: TParamOptions[K], isOptional: ParamIsOptionalOrHasDefault<K & string, TParamOptions[K]>, isGreedy: false }
}

type QueryArrayToUrlPart<TParamOptions extends [string, string | ParamOptions][]> = TParamOptions extends [infer First extends [string, string | ParamOptions], ...infer Rest extends [string, string | ParamOptions][]]
  ? First extends [string, string]
    ? {}
    : First extends [infer TKey extends string, infer TParamOption extends ParamOptions]
      ? Identity<Record<ExtractParamName<TKey>, { param: TParamOption, isOptional: ParamIsOptionalOrHasDefault<TKey, TParamOption>, isGreedy: false }> & QueryArrayToUrlPart<Rest>>
      : never
  : {}

export function toUrlQueryPart<T extends UrlQueryPart | string | undefined>(querySource: T): ToUrlQueryPart<T>
export function toUrlQueryPart(querySource: UrlQueryPart): UrlPart {
  if (typeof querySource === 'string' || typeof querySource === 'undefined' || isUrlPart(querySource)) {
    return toUrlPart(querySource)
  }

  const entries = Array.isArray(querySource) ? querySource : Object.entries(querySource)
  const source: string[] = []
  const params: Record<string, ParamOptions> = {}

  for (const [key, value] of entries) {
    if (isLiteralParam(value)) {
      source.push(`${key}=${value}`)
    } else {
      const paramKey = `[${key}]`
      const paramName = getParamName(paramKey)

      if (paramName) {
        params[paramName] = value
      }

      source.push(`${paramName}=${paramKey}`)
    }
  }

  return withParams(source.join('&'), params)
}
