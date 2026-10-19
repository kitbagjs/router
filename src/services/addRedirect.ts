import { InvalidRouteRedirectError } from '@/errors/invalidRouteRedirectError'
import { RouteRedirectCallback, RouteRedirectOptions } from '@/types/redirects'
import { isRoute, Route } from '@/types/route'

export function addRedirect<TRouteFrom extends Route, TRouteTo extends Route>(
  from: TRouteFrom,
  to: TRouteTo,
  convertParams?: RouteRedirectCallback<TRouteTo, TRouteFrom>,
  options?: RouteRedirectOptions,
): void {
  if (!isRoute(from)) {
    throw new InvalidRouteRedirectError(from.name)
  }

  to.context.push(from)
  from.context.push(to)

  from.redirect(to, convertParams, options)
}
