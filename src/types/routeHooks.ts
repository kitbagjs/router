import { InternalRouteHooks, ExternalRouteHooks } from '@/types/hooks'
import { RouteContext } from '@/types/routeContext'
import { CreatedRouteOptions, Route } from '@/types/route'
import { RouteWithMethods, ExternalRouteWithMethods } from '@/types/routeWithMethods'
import { Url } from '@/types/url'

export type RouteHooks<
  TUrl extends Url = Url,
  TMatches extends CreatedRouteOptions[] = CreatedRouteOptions[]
> = {
  onBeforeRouteEnter: (...args: Parameters<InternalRouteHooks<Route<TUrl, TMatches>, Route<TUrl, TMatches>['context']>['onBeforeRouteEnter']>) => RouteWithMethods<TUrl, TMatches>,
  onBeforeRouteUpdate: (...args: Parameters<InternalRouteHooks<Route<TUrl, TMatches>, Route<TUrl, TMatches>['context']>['onBeforeRouteUpdate']>) => RouteWithMethods<TUrl, TMatches>,
  onBeforeRouteLeave: (...args: Parameters<InternalRouteHooks<Route<TUrl, TMatches>, Route<TUrl, TMatches>['context']>['onBeforeRouteLeave']>) => RouteWithMethods<TUrl, TMatches>,
  onAfterRouteEnter: (...args: Parameters<InternalRouteHooks<Route<TUrl, TMatches>, Route<TUrl, TMatches>['context']>['onAfterRouteEnter']>) => RouteWithMethods<TUrl, TMatches>,
  onAfterRouteUpdate: (...args: Parameters<InternalRouteHooks<Route<TUrl, TMatches>, Route<TUrl, TMatches>['context']>['onAfterRouteUpdate']>) => RouteWithMethods<TUrl, TMatches>,
  onAfterRouteLeave: (...args: Parameters<InternalRouteHooks<Route<TUrl, TMatches>, Route<TUrl, TMatches>['context']>['onAfterRouteLeave']>) => RouteWithMethods<TUrl, TMatches>,
}

export type ExternalRouteChainableHooks<
  TRoute extends Route = Route,
  TContext extends RouteContext[] | undefined = undefined
> = {
  onBeforeRouteEnter: (...args: Parameters<ExternalRouteHooks<TRoute, TContext>['onBeforeRouteEnter']>) => ExternalRouteWithMethods<TRoute, TContext>,
}
