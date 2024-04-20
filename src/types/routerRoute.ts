import { ExtractParamTypes, MergeParams, Param } from '@/types/params'
import { RouteProps } from '@/types/routeProps'
import { Path, Query, ToPath, ToQuery } from '@/utilities'

export type Routes = Readonly<Route[]>

export type Route<
  TName extends string | undefined = any,
  TPath extends string | Path = Path,
  TQuery extends string | Query | undefined = Query,
  TDisabled extends boolean | undefined = boolean
> = {
  matched: RouteProps,
  matches: RouteProps[],
  name: TName,
  path: ToPath<TPath>,
  query: ToQuery<TQuery>,
  pathParams: ToPath<TPath>['params'],
  queryParams: ToQuery<TQuery>['params'],
  depth: number,
  disabled: TDisabled extends boolean ? TDisabled : false,
}

export type ExtractRouteParamTypes<TRoute extends { pathParams: Record<string, unknown>, queryParams: Record<string, unknown> }> = TRoute extends { pathParams: infer PathParams extends Record<string, Param | undefined>, queryParams: infer QueryParams extends Record<string, Param | undefined> }
  ? ExtractParamTypes<MergeParams<PathParams, QueryParams>>
  : never