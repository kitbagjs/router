import { InvalidRouteRedirectError } from '@/errors/invalidRouteRedirectError'
import { RouteRedirects, RouteRedirectFrom, RouteRedirectTo, RedirectToArgs } from '@/types/redirects'
import { isRoute, Route } from '@/types/route'

type CreateRouteRedirectsContext = {
  /**
   * The to route for the redirectFrom callback and the from route for the redirectTo callback.
   */
  getRoute: () => Route,
}

export function createRouteRedirects({ getRoute }: CreateRouteRedirectsContext): RouteRedirects {
  const redirectTo: RouteRedirectTo = (...[to, convertParams, options]: RedirectToArgs) => {
    const from = getRoute()

    if (!isRoute(from)) {
      throw new InvalidRouteRedirectError(from.name)
    }

    to.context.push(from)
    from.context.push(to)

    from.redirect(to, convertParams, options)
  }

  const redirectFrom: RouteRedirectFrom = (from, convertParams, options) => {
    const to = getRoute()

    if (!isRoute(from)) {
      throw new InvalidRouteRedirectError(from.name)
    }

    to.context.push(from)
    from.context.push(to)

    from.redirect(to, convertParams, options)
  }

  return {
    redirectTo,
    redirectFrom,
  }
}
