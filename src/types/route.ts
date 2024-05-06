import { ExtractParamTypes, MergeParams } from '@/types/params'
import { Param } from '@/types/paramTypes'
import { Path, ToPath } from '@/types/path'
import { Query, ToQuery } from '@/types/query'
import { RouteMeta, RouteProps } from '@/types/routeProps'

export type Routes = Readonly<Route[]>

type RoutePropsWithMeta = RouteProps & { meta: RouteMeta }

export type Route<
  TKey extends string | undefined = any,
  TPath extends string | Path = Path,
  TQuery extends string | Query | undefined = Query,
  TDisabled extends boolean | undefined = boolean
> = {
  matched: RoutePropsWithMeta,
  matches: RoutePropsWithMeta[],
  key: TKey,
  path: ToPath<TPath>,
  query: ToQuery<TQuery>,
  depth: number,
  disabled: TDisabled extends boolean ? TDisabled : false,
}

export type ExtractRouteParamTypes<TRoute extends { path: { params: Record<string, unknown> }, query: { params: Record<string, unknown> } }> = TRoute extends { path: { params: infer PathParams extends Record<string, Param | undefined> }, query: { params: infer QueryParams extends Record<string, Param | undefined> } }
  ? ExtractParamTypes<MergeParams<PathParams, QueryParams>>
  : Record<string, unknown>