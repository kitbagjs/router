import { DeepReadonly } from 'vue'
import { ResolvedRouteQuery } from '@/types/resolvedQuery'
import { ExtractRouteParamTypes, Route } from '@/types/route'
import { RouteProps } from '@/types/routeProps'

type BaseResolvedRoute = Route & { path: { params: Record<string, unknown> }, query: { params: Record<string, unknown> } }

export type ResolvedRoute<TRoute extends Route = BaseResolvedRoute> = DeepReadonly<{
  matched: TRoute['matched'],
  matches: RouteProps[],
  key: TRoute['key'],
  query: ResolvedRouteQuery,
  params: ExtractRouteParamTypes<TRoute>,
}>