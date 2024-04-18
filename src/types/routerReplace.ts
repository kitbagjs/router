import { RouterPushOptions } from '@/types/routerPush'
import { RouterRoutes } from '@/types/routerRoute'
import { RoutesKey } from '@/types/routesMap'
import { RouteParamsByName } from '@/types/routeWithParams'
import { Url } from '@/types/url'
import { AllPropertiesAreOptional } from '@/types/utilities'

export type RouterReplaceOptions = Omit<RouterPushOptions, 'replace'>

type RouterReplaceArgs<
  TRoutes extends RouterRoutes,
  TSource extends string & keyof RoutesKey<TRoutes>,
  TParams = RouteParamsByName<TRoutes, TSource>
> = AllPropertiesAreOptional<TParams> extends true
  ? [params?: TParams, options?: RouterReplaceOptions]
  : [params: TParams, options?: RouterReplaceOptions]

export type RouterReplace<
  TRoutes extends RouterRoutes
> = {
  <TSource extends RoutesKey<TRoutes>>(source: TSource, ...args: RouterReplaceArgs<TRoutes, TSource>): Promise<void>,
  (source: Url, options?: RouterReplaceOptions): Promise<void>,
}
