import { ResolvedRoute } from '@/types/resolved'
import { Routes } from '@/types/route'
import { RoutesName } from '@/types/routesMap'
import { RouteParamsByKey } from '@/types/routeWithParams'
import { Url } from '@/types/url'
import { AllPropertiesAreOptional } from '@/types/utilities'

type RouterFindArgs<
  TRoutes extends Routes,
  TSource extends RoutesName<TRoutes>,
  TParams = RouteParamsByKey<TRoutes, TSource>
> = AllPropertiesAreOptional<TParams> extends true
  ? [params?: TParams]
  : [params: TParams]

export type RouterFind<
  TRoutes extends Routes
> = {
  <TSource extends RoutesName<TRoutes>>(name: TSource, ...args: RouterFindArgs<TRoutes, TSource>): ResolvedRoute | undefined,
  (url: Url): ResolvedRoute | undefined,
}
