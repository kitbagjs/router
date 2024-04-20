import { ResolvedRouteQuery } from '@/types/resolvedQuery'
import { RouteProps } from '@/types/routeProps'
import { ExtractRouteParamTypes, Route } from '@/types/routerRoute'

export type ResolvedRoute<TRoute extends Route = Route> = {
  matched: TRoute['matched'],
  matches: RouteProps[],
  name: TRoute['name'],
  query: ResolvedRouteQuery,
  params: ExtractRouteParamTypes<TRoute>,
}