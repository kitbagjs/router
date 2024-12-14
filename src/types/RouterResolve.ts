import { Routes } from '@/types/route'
import { RoutesName } from '@/types/routesMap'
import { RouteParamsByKey } from '@/types/routeWithParams'
import { Url } from '@/types/url'
import { AllPropertiesAreOptional } from '@/types/utilities'
import { QuerySource } from '@/types/query'
import { ResolvedRoute } from '@/types'

export type RouterResolveOptions = {
  query?: QuerySource,
  hash?: string,
  state?: unknown,
}

type RouterResolveArgs<
  TRoutes extends Routes,
  TSource extends RoutesName<TRoutes>,
  TParams = RouteParamsByKey<TRoutes, TSource>
> = AllPropertiesAreOptional<TParams> extends true
  ? [params?: TParams, options?: RouterResolveOptions]
  : [params: TParams, options?: RouterResolveOptions]

export type RouterResolve<
  TRoutes extends Routes
> = {
  <TSource extends RoutesName<TRoutes>>(name: TSource, ...args: RouterResolveArgs<TRoutes, TSource>): ResolvedRoute | undefined,
  (url: Url, options?: RouterResolveOptions): ResolvedRoute | undefined,
}