import { DeepReadonly } from 'vue'
import { ResolvedRouteQuery } from '@/types/resolvedQuery'
import { ExtractRouteParamTypes, Route } from '@/types/route'
import { RouteProps } from '@/types/routeProps'

export type ResolvedRoute<TRoute extends Route = Route> = {
  matched: TRoute['matched'],
  matches: RouteProps[],
  key: TRoute['key'],
  query: ResolvedRouteQuery,
  params: ExtractRouteParamTypes<TRoute>,
}

export type ReadonlyResolvedRoute<TRoute extends ResolvedRoute = ResolvedRoute> = DeepReadonly<Omit<TRoute, 'params'>> & Readonly<{ params: TRoute['params'] }>
