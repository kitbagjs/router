import { InternalRouteHooks } from '@/types/hooks'
import { RouteContext } from '@/types/routeContext'
import { CreatedRouteOptions, Route } from '@/types/route'
import { RouteWithMethods, ExternalRouteWithMethods } from '@/types/routeWithMethods'
import { Url } from '@/types/url'

type RouteHookMethods<
  TUrl extends Url,
  TMatches extends CreatedRouteOptions[]
> = InternalRouteHooks<Route<TUrl, TMatches>, Route<TUrl, TMatches>['context']>

export type RouteHooks<
  TUrl extends Url = Url,
  TMatches extends CreatedRouteOptions[] = CreatedRouteOptions[]
> = {
  onBeforeRouteEnter: (...args: Parameters<RouteHookMethods<TUrl, TMatches>['onBeforeRouteEnter']>) => RouteWithMethods<TUrl, TMatches>,
  onBeforeRouteUpdate: (...args: Parameters<RouteHookMethods<TUrl, TMatches>['onBeforeRouteUpdate']>) => RouteWithMethods<TUrl, TMatches>,
  onBeforeRouteLeave: (...args: Parameters<RouteHookMethods<TUrl, TMatches>['onBeforeRouteLeave']>) => RouteWithMethods<TUrl, TMatches>,
  onAfterRouteEnter: (...args: Parameters<RouteHookMethods<TUrl, TMatches>['onAfterRouteEnter']>) => RouteWithMethods<TUrl, TMatches>,
  onAfterRouteUpdate: (...args: Parameters<RouteHookMethods<TUrl, TMatches>['onAfterRouteUpdate']>) => RouteWithMethods<TUrl, TMatches>,
  onAfterRouteLeave: (...args: Parameters<RouteHookMethods<TUrl, TMatches>['onAfterRouteLeave']>) => RouteWithMethods<TUrl, TMatches>,
}

type ExternalRouteHookMethods<
  TRoute extends Route,
  TContext extends RouteContext[] | undefined
> = InternalRouteHooks<TRoute, TContext>

export type ExternalRouteHooks<
  TRoute extends Route = Route,
  TContext extends RouteContext[] | undefined = undefined
> = {
  onBeforeRouteEnter: (...args: Parameters<ExternalRouteHookMethods<TRoute, TContext>['onBeforeRouteEnter']>) => ExternalRouteWithMethods<TRoute, TContext>,
}
