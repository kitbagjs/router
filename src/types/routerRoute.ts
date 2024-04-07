import { ExtractParamTypes, MergeParams, Param } from '@/types/params'
import { Route } from '@/types/routes'
import { Path, Query, ToPath, ToQuery } from '@/utilities'

export type RouterRoutes = Readonly<RouterRoute[]>

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
  pathParams: ToPath<TPath>['params'],
  queryParams: ToQuery<TQuery>['params'],
  depth: number,
}

export type ExtractRouterRouteParamTypes<TRoute extends RouterRoute> = TRoute extends { pathParams: infer PathParams extends Record<string, Param | undefined>, queryParams: infer QueryParams extends Record<string, Param | undefined> }
  ? ExtractParamTypes<MergeParams<PathParams, QueryParams>>
  : never