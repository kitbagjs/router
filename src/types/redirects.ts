import { ExtractRouteParamTypesReading, ExtractRouteParamTypesWriting } from './params'
import { Route } from './route'

export type InternalRouteRedirects<
  TRoute extends Route
> = {
  redirectTo: RouteRedirectTo<TRoute>,
  redirectFrom: RouteRedirectFrom<TRoute>,
}

export type RouteRedirectCallback<
  TRouteTo extends Route,
  TRouteFrom extends Route
> = (params: ExtractRouteParamTypesReading<TRouteFrom>) => ExtractRouteParamTypesWriting<TRouteTo>

export type RouteRedirectTo<
  TRouteFrom extends Route
> = <TRouteTo extends Route>(to: TRouteTo, callback: RouteRedirectCallback<TRouteTo, TRouteFrom>) => void

export type RouteRedirectFrom<
  TRouteTo extends Route
> = <TRouteFrom extends Route>(from: TRouteFrom, callback: RouteRedirectCallback<TRouteTo, TRouteFrom>) => void
