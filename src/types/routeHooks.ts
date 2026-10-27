import { InternalRouteHooks } from '@/types/hooks'
import { RouteContext } from '@/types/routeContext'
import { CreatedRouteOptions, Route } from '@/types/route'
import { RouteWithMethods, ExternalRouteWithMethods } from '@/types/routeWithMethods'
import { Url } from '@/types/url'

export interface RouteHooks<
  TUrl extends Url = Url,
  TMatches extends CreatedRouteOptions[] = CreatedRouteOptions[]
> extends InternalRouteHooks<Route<TUrl, TMatches>, Route<TUrl, TMatches>['context'], RouteWithMethods<TUrl, TMatches>> {}

export type ExternalRouteHooks<
  TRoute extends Route = Route,
  TContext extends RouteContext[] | undefined = undefined
> = {
  onBeforeRouteEnter: InternalRouteHooks<TRoute, TContext, ExternalRouteWithMethods<TRoute, TContext>>['onBeforeRouteEnter'],
}
