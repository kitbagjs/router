import { InternalRouteHooks } from '@/types/hooks'
import { RouteContext } from '@/types/routeContext'
import { CreatedRouteOptions, Route } from '@/types/route'
import { RouteWithMethods, ExternalRouteWithMethods } from '@/types/routeWithMethods'
import { Url } from '@/types/url'

type RouteHookMethods<
  TUrl extends Url,
  TMatches extends CreatedRouteOptions[]
> = InternalRouteHooks<Route<TUrl, TMatches>, Route<TUrl, TMatches>['context'], RouteWithMethods<TUrl, TMatches>>

export type RouteHooks<
  TUrl extends Url = Url,
  TMatches extends CreatedRouteOptions[] = CreatedRouteOptions[]
> = {
  onBeforeRouteEnter: RouteHookMethods<TUrl, TMatches>['onBeforeRouteEnter'],
  onBeforeRouteUpdate: RouteHookMethods<TUrl, TMatches>['onBeforeRouteUpdate'],
  onBeforeRouteLeave: RouteHookMethods<TUrl, TMatches>['onBeforeRouteLeave'],
  onAfterRouteEnter: RouteHookMethods<TUrl, TMatches>['onAfterRouteEnter'],
  onAfterRouteUpdate: RouteHookMethods<TUrl, TMatches>['onAfterRouteUpdate'],
  onAfterRouteLeave: RouteHookMethods<TUrl, TMatches>['onAfterRouteLeave'],
}

type ExternalRouteHookMethods<
  TRoute extends Route,
  TContext extends RouteContext[] | undefined
> = InternalRouteHooks<TRoute, TContext, ExternalRouteWithMethods<TRoute, TContext>>

export type ExternalRouteHooks<
  TRoute extends Route = Route,
  TContext extends RouteContext[] | undefined = undefined
> = {
  onBeforeRouteEnter: ExternalRouteHookMethods<TRoute, TContext>['onBeforeRouteEnter'],
}
