import { RouteRedirectTo, RouteRedirectFrom } from '@/types/redirects'
import { RouteContext } from '@/types/routeContext'
import { CreatedRouteOptions, Route } from '@/types/route'
import { RouteWithMethods, ExternalRouteWithMethods } from '@/types/routeWithMethods'
import { Url } from '@/types/url'

export type RouteRedirects<
  TUrl extends Url = Url,
  TMatches extends CreatedRouteOptions[] = CreatedRouteOptions[]
> = {
  redirectTo: RouteRedirectTo<Route<TUrl, TMatches>, RouteWithMethods<TUrl, TMatches>>,
  redirectFrom: RouteRedirectFrom<Route<TUrl, TMatches>, RouteWithMethods<TUrl, TMatches>>,
}

export type ExternalRouteRedirects<
  TRoute extends Route = Route,
  TContext extends RouteContext[] | undefined = undefined
> = {
  redirectTo: RouteRedirectTo<TRoute, ExternalRouteWithMethods<TRoute, TContext>>,
  redirectFrom: RouteRedirectFrom<TRoute, ExternalRouteWithMethods<TRoute, TContext>>,
}
