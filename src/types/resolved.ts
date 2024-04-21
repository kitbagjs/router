import { DeepReadonly } from 'vue'
import { ResolvedRouteQuery } from '@/types/resolvedQuery'
import { ExtractRouteParamTypes, Route } from '@/types/route'
import { RouteProps } from '@/types/routeProps'


export type ResolvedRouteSource<TRoute extends Route = Route> = {
  matched: TRoute['matched'],
  matches: RouteProps[],
  key: TRoute['key'],
  query: ResolvedRouteQuery,
  params: ExtractRouteParamTypes<TRoute>,
}

export type ResolvedRoute<TRoute extends Route = Route> = Readonly<{
  matched: DeepReadonly<TRoute['matched']>,
  matches: DeepReadonly<RouteProps[]>,
  key: TRoute['key'],
  query: ResolvedRouteQuery,
  params: DeepReadonly<ExtractRouteParamTypes<TRoute>>,
}>