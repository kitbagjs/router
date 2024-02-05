import { ExtractParamName, ExtractPathParamType, Param } from '@/types/params'
import { MergeParams } from '@/types/routeMethods'
import { Identity } from '@/types/utilities'
import { getParamsForString } from '@/utilities/getParamsForString'

type ExtractQueryParamsFromQueryString<
  TQuery extends string,
  TParams extends Record<string, Param | undefined> = Record<never, never>
> = TQuery extends `${string}=:${infer Param}&${infer Rest}`
  ? MergeParams<{ [P in ExtractParamName<Param>]: ExtractPathParamType<Param, TParams> }, ExtractQueryParamsFromQueryString<Rest, TParams>>
  : TQuery extends `${string}:${infer Param}`
    ? { [P in ExtractParamName<Param>]: [ExtractPathParamType<Param, TParams>] }
    : Record<never, never>

type QueryParams<T extends string> = {
  [K in keyof ExtractQueryParamsFromQueryString<T>]?: Param
}

export type Query<
  T extends string = any,
  P extends QueryParams<T> = any
> = {
  query: T,
  params: Identity<ExtractQueryParamsFromQueryString<T, P>>,
}

export function query<T extends string, P extends QueryParams<T>>(query: T, params: Identity<P>): Query<T, P> {
  return {
    query,
    params: getParamsForString(query, params) as Query<T, P>['params'],
  }
}