import { ResolvedRouteUnion } from './resolved'
import { Route, Routes } from './route'
import { RouterReplace } from './routerReplace'
import { UrlParamsReading, UrlParamsWriting } from './url'
import { AllPropertiesAreOptional, MaybePromise } from './utilities'

/**
 * redirect is returned by createRouteHooks but is not part of the Route type, so we use this type to assert that it exists.
 */
type RouteWithRedirect<TRoute extends Route = Route> = TRoute & { redirect: RouteRedirect }

/**
 * Type guard to assert that a route has a redirect hook.
 * @internal
 */
export function isRouteWithRedirect(route: Route): route is RouteWithRedirect {
  return 'redirect' in route
}

export type RouteRedirects<
  TRoute extends Route = Route
> = {
  /**
   * Creates a redirect to redirect the current route to another route.
   */
  redirectTo: RouteRedirectTo<TRoute>,
  /**
   * Creates a redirect to redirect to the current route from another route.
   */
  redirectFrom: RouteRedirectFrom<TRoute>,
}

type RedirectHookContext<
  TRoutes extends Routes
> = {
  replace: RouterReplace<TRoutes>,
}

export type RedirectHook<
  TRoutes extends Routes = Routes,
  TRouteTo extends Route = TRoutes[number]
> = (to: ResolvedRouteUnion<TRouteTo>, context: RedirectHookContext<TRoutes>) => MaybePromise<void>

export type RouteRedirectCallback<
  TRouteTo extends Route = Route,
  TRouteFrom extends Route = Route
> = (params: UrlParamsReading<TRouteFrom>) => UrlParamsWriting<TRouteTo>

/**
 * This type is purposely wide to prevent type errors in RouteRedirectFrom where the TRouteTo generic cannot be inferred.
 */
export type RouteRedirect = (to: Route, callback?: (params: any) => any) => void

export type RedirectToArgs<
  TRouteTo extends Route = Route,
  TRouteFrom extends Route = Route
> = AllPropertiesAreOptional<UrlParamsWriting<TRouteTo>> extends true
  ? [to: TRouteTo, params?: RouteRedirectCallback<TRouteTo, TRouteFrom>]
  : [to: TRouteTo, params: RouteRedirectCallback<TRouteTo, TRouteFrom>]

export type RouteRedirectTo<
  TRouteFrom extends Route = Route
> = <TRouteTo extends Route>(...args: RedirectToArgs<TRouteTo, TRouteFrom>) => void

export type RedirectFromArgs<
  TRouteTo extends Route = Route,
  TRouteFrom extends Route = Route
> = AllPropertiesAreOptional<UrlParamsWriting<TRouteTo>> extends true
  ? [from: TRouteFrom, params?: RouteRedirectCallback<TRouteTo, TRouteFrom>]
  : [from: TRouteFrom, params: RouteRedirectCallback<TRouteTo, TRouteFrom>]

export type RouteRedirectFrom<
  TRouteTo extends Route = Route
> = <TRouteFrom extends Route>(...args: RedirectFromArgs<TRouteTo, TRouteFrom>) => void
