import { query } from '@/services/query'
import { ExtractParamName, ExtractPathParamType, ParamEnd, ParamStart } from '@/types/params'
import { Param } from '@/types/paramTypes'
import { Identity } from '@/types/utilities'
import { isRecord } from '@/utilities/guards'

type ExtractQueryParamsFromQueryString<
  TQuery extends string,
  TParams extends Record<string, Param | undefined> = Record<never, never>
> = TQuery extends `${string}=${ParamStart}${infer Param}${ParamEnd}${infer Rest}`
  ? { [P in Param]: ExtractPathParamType<Param, TParams> } & ExtractQueryParamsFromQueryString<Rest, TParams>
  : Record<never, never>

export type QueryParams<T extends string> = {
  [K in keyof ExtractQueryParamsFromQueryString<T>]?: Param
}

export type QueryParamsWithParamNameExtracted<T extends string> = {
  [K in keyof ExtractQueryParamsFromQueryString<T> as ExtractParamName<K>]?: Param
}

export type Query<
  TQuery extends string = string,
  TQueryParams extends QueryParamsWithParamNameExtracted<TQuery> = Record<string, Param | undefined>
> = {
  query: TQuery,
  params: string extends TQuery ? Record<string, Param> : Identity<ExtractQueryParamsFromQueryString<TQuery, TQueryParams>>,
  toString: () => string,
}

export type ToQuery<T extends string | Query | undefined> = T extends string
  ? Query<T, {}>
  : T extends undefined
    ? Query<'', {}>
    : unknown extends T
      ? Query<'', {}>
      : T

function isQuery(value: unknown): value is Query {
  return isRecord(value) && typeof value.query === 'string'
}

export function toQuery<T extends string | Query | undefined>(value: T): ToQuery<T>
export function toQuery<T extends string | Query | undefined>(value: T): Query {
  if (value === undefined) {
    return query('', {})
  }

  if (isQuery(value)) {
    return value
  }

  return query(value, {})
}