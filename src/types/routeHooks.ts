import { InternalRouteHooks, HookRegistrationOptions } from '@/types/hooks'
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
  onBeforeRouteEnter: (hook: Parameters<RouteHookMethods<TUrl, TMatches>['onBeforeRouteEnter']>[0], options?: HookRegistrationOptions) => RouteWithMethods<TUrl, TMatches>,
  onBeforeRouteUpdate: (hook: Parameters<RouteHookMethods<TUrl, TMatches>['onBeforeRouteUpdate']>[0], options?: HookRegistrationOptions) => RouteWithMethods<TUrl, TMatches>,
  onBeforeRouteLeave: (hook: Parameters<RouteHookMethods<TUrl, TMatches>['onBeforeRouteLeave']>[0], options?: HookRegistrationOptions) => RouteWithMethods<TUrl, TMatches>,
  onAfterRouteEnter: (hook: Parameters<RouteHookMethods<TUrl, TMatches>['onAfterRouteEnter']>[0], options?: HookRegistrationOptions) => RouteWithMethods<TUrl, TMatches>,
  onAfterRouteUpdate: (hook: Parameters<RouteHookMethods<TUrl, TMatches>['onAfterRouteUpdate']>[0], options?: HookRegistrationOptions) => RouteWithMethods<TUrl, TMatches>,
  onAfterRouteLeave: (hook: Parameters<RouteHookMethods<TUrl, TMatches>['onAfterRouteLeave']>[0], options?: HookRegistrationOptions) => RouteWithMethods<TUrl, TMatches>,
}

type ExternalRouteHookMethods<
  TRoute extends Route,
  TContext extends RouteContext[] | undefined
> = InternalRouteHooks<TRoute, TContext>

export type ExternalRouteHooks<
  TRoute extends Route = Route,
  TContext extends RouteContext[] | undefined = undefined
> = {
  onBeforeRouteEnter: (hook: Parameters<ExternalRouteHookMethods<TRoute, TContext>['onBeforeRouteEnter']>[0], options?: HookRegistrationOptions) => ExternalRouteWithMethods<TRoute, TContext>,
}
