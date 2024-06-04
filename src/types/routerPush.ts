import { NamedNotDisabledRoute, Routes } from '@/types/route'
import { RoutesKey } from '@/types/routesMap'
import { RouteParamsByKey } from '@/types/routeWithParams'
import { Url } from '@/types/url'
import { AllPropertiesAreOptional } from '@/types/utilities'

export type RouterPushOptions = {
  query?: Record<string, string>,
  replace?: boolean,
}

type RouterPushArgs<
  TRoutes extends Routes,
  TSource extends RoutesKey<TRoutes>,
  TParams = RouteParamsByKey<TRoutes, TSource>
> = AllPropertiesAreOptional<TParams> extends true
  ? [params?: TParams, options?: RouterPushOptions]
  : [params: TParams, options?: RouterPushOptions]

export type RouterPush<
  TRoutes extends Routes = NamedNotDisabledRoute[]
> = {
  <TSource extends RoutesKey<TRoutes>>(source: TSource, ...args: RouterPushArgs<TRoutes, TSource>): Promise<void>,
  (source: Url, options?: RouterPushOptions): Promise<void>,
}
