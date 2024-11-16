import { query as createQuery } from '@/services/query'
import { ExtractParamName, ExtractPathParamType, ParamEnd, ParamStart } from '@/types/params'
import { Param } from '@/types/paramTypes'
import { Identity } from '@/types/utilities'
import { isRecord } from '@/utilities/guards'

export type QuerySource = ConstructorParameters<typeof URLSearchParams>[0]

type ExtractQueryParamsFromQueryString<
  TQuery extends string,
  TParams extends Record<string, Param | undefined> = Record<never, never>
> = TQuery extends `${string}=${ParamStart}${infer Param}${ParamEnd}${infer Rest}`
  ? Record<Param, ExtractPathParamType<Param, TParams>> & ExtractQueryParamsFromQueryString<Rest, TParams>
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
  value: TQuery,
  params: string extends TQuery ? Record<string, Param> : Identity<ExtractQueryParamsFromQueryString<TQuery, TQueryParams>>,
}

export type ToQuery<T extends string | Query | undefined> = T extends string
  ? Query<T, {}>
  : T extends undefined
    ? Query<'', {}>
    : unknown extends T
      ? Query<'', {}>
      : T

function isQuery(maybeQuery: unknown): maybeQuery is Query {
  return isRecord(maybeQuery) && typeof maybeQuery.value === 'string'
}

export function toQuery<T extends string | Query | undefined>(query: T): ToQuery<T>
export function toQuery<T extends string | Query | undefined>(query: T): Query {
  if (query === undefined) {
    return createQuery('', {})
  }

  if (isQuery(query)) {
    return query
  }

  return createQuery(query, {})
}
