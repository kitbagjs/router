import { Routes } from '@/types/route'
import { RoutesName } from '@/types/routesMap'
import { RouteParamsByKey } from '@/types/routeWithParams'
import { AllPropertiesAreOptional } from '@/types/utilities'
import { QuerySource } from '@/types/querySource'
import { ResolvedRoute } from '@/types/resolved'
import { RouteStateByName } from '@/types/state'

export type RouterResolveOptions<
  TState = unknown
> = {
  query?: QuerySource,
  hash?: string,
  state?: Partial<TState>,
}

type RouterResolveArgs<
  TRoutes extends Routes,
  TSource extends RoutesName<TRoutes>
> = AllPropertiesAreOptional<RouteParamsByKey<TRoutes, TSource>> extends true
  ? [params?: RouteParamsByKey<TRoutes, TSource>, options?: RouterResolveOptions<RouteStateByName<TRoutes, TSource>>]
  : [params: RouteParamsByKey<TRoutes, TSource>, options?: RouterResolveOptions<RouteStateByName<TRoutes, TSource>>]

export type RouterResolve<
  TRoutes extends Routes
> = <TSource extends RoutesName<TRoutes>>(name: TSource, ...args: RouterResolveArgs<TRoutes, TSource>) => ResolvedRoute
