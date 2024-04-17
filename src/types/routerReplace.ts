import { RouterPushOptions } from '@/types/routerPush'
import { RouterRoutes } from '@/types/routerRoute'
import { RouteKeysThatHaveOptionalParams, RouteKeysThatHaveRequireParams, RouteParamsByName } from '@/types/routeWithParams'
import { Url } from '@/types/url'

export type RouterReplaceOptions = Omit<RouterPushOptions, 'replace'>

export type RouterReplace<
  TRoutes extends RouterRoutes
> = {
  <TSource extends RouteKeysThatHaveOptionalParams<TRoutes>>(source: TSource, params?: RouteParamsByName<TRoutes, TSource>, options?: RouterPushOptions): Promise<void>,
  <TSource extends RouteKeysThatHaveRequireParams<TRoutes>>(source: TSource, params: RouteParamsByName<TRoutes, TSource>, options?: RouterPushOptions): Promise<void>,
  (source: Url, options?: RouterPushOptions): Promise<void>,
}
