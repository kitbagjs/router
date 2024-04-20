import { Routes } from '@/types/routerRoute'
import { RoutesKey } from '@/types/routesMap'
import { RouteParamsByName } from '@/types/routeWithParams'
import { Url } from '@/types/url'
import { AllPropertiesAreOptional } from '@/types/utilities'

export type RouterPushOptions = {
  query?: Record<string, string>,
  replace?: boolean,
}

type RouterPushArgs<
  TRoutes extends Routes,
  TSource extends string & keyof RoutesKey<TRoutes>,
  TParams = RouteParamsByName<TRoutes, TSource>
> = AllPropertiesAreOptional<TParams> extends true
  ? [params?: TParams, options?: RouterPushOptions]
  : [params: TParams, options?: RouterPushOptions]

export type RouterPush<
  TRoutes extends Routes
> = {
  <TSource extends RoutesKey<TRoutes>>(source: TSource, ...args: RouterPushArgs<TRoutes, TSource>): Promise<void>,
  (source: Url, options?: RouterPushOptions): Promise<void>,
}