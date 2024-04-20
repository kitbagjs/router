import { ResolvedRouteQuery } from '@/types/resolvedQuery'
import { ExtractRouterRouteParamTypes, RouterRoute } from '@/types/routerRoute'
import { RouteProps } from '@/types/routes'

export type ResolvedRoute<TRoute extends RouterRoute = RouterRoute> = {
  matched: TRoute['matched'],
  matches: RouteProps[],
  name: TRoute['name'],
  query: ResolvedRouteQuery,
  params: ExtractRouterRouteParamTypes<TRoute>,
}