import { ResolvedRouteQuery } from '@/types/resolvedQuery'
import { ExtractRouterRouteParamTypes, RouterRoute } from '@/types/routerRoute'
import { Route } from '@/types/routes'

export type ResolvedRoute<TRoute extends RouterRoute = RouterRoute> = {
  matched: TRoute['matched'],
  matches: Route[],
  name: TRoute['name'],
  query: ResolvedRouteQuery,
  params: ExtractRouterRouteParamTypes<TRoute>,
}