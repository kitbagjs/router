import { Routes } from '@/types/route'
import { RouterPushOptions } from '@/types/routerPush'
import { RoutesKey } from '@/types/routesMap'
import { RouteParamsByKey } from '@/types/routeWithParams'
import { Url } from '@/types/url'
import { AllPropertiesAreOptional } from '@/types/utilities'

export type RouterReplaceOptions = Omit<RouterPushOptions, 'replace'>

type RouterReplaceArgs<
  TRoutes extends Routes,
  TSource extends string & keyof RoutesKey<TRoutes>,
  TParams = RouteParamsByKey<TRoutes, TSource>
> = AllPropertiesAreOptional<TParams> extends true
  ? [params?: TParams, options?: RouterReplaceOptions]
  : [params: TParams, options?: RouterReplaceOptions]

export type RouterReplace<
  TRoutes extends Routes
> = {
  <TSource extends RoutesKey<TRoutes>>(source: TSource, ...args: RouterReplaceArgs<TRoutes, TSource>): Promise<void>,
  (source: Url, options?: RouterReplaceOptions): Promise<void>,
}
