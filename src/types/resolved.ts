import { DeepReadonly } from 'vue'
import { ResolvedRouteQuery } from '@/types/resolvedQuery'
import { ExtractRouteParamTypes, Route } from '@/types/route'
import { RouteProps } from '@/types/routeProps'

export type ResolvedRoute<TRoute extends Route = Route> = DeepReadonly<{
  matched: TRoute['matched'],
  matches: RouteProps[],
  key: TRoute['key'],
  query: ResolvedRouteQuery,
  params: ExtractRouteParamTypes<TRoute>,
}>

export type RouterRoute<TRoute extends Route = Route> = Omit<ResolvedRoute<TRoute>, 'params'> & Readonly<{
  params: ExtractRouteParamTypes<TRoute>,
}>