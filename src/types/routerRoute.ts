import { ExtractParamTypes, MergeParams, Param } from '@/types/params'
import { Route } from '@/types/routes'
import { Path, Query, ToPath, ToQuery } from '@/utilities'

export type RouterRoute<
  TName extends string | undefined = any,
  TPath extends string | Path = Path,
  TQuery extends string | Query | undefined = Query
> = {
  matched: Route,
  matches: Route[],
  name: TName,
  path: ToPath<TPath>,
  query: ToQuery<TQuery>,
  pathParams: Record<string, Param>,
  queryParams: Record<string, Param>,
  depth: number,
}

export type ExtractRouterRouteParamTypes<TRoute extends RouterRoute> = TRoute extends { pathParams: infer PathParams extends Record<string, Param>, queryParams: infer QueryParams extends Record<string, Param> }
  ? ExtractParamTypes<MergeParams<PathParams, QueryParams>>
  : never