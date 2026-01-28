import { InvalidRouteRedirectError } from '@/errors/invalidRouteRedirectError'
import { RouteRedirects, isRouteWithRedirect, RouteRedirectFrom, RouteRedirectTo, RedirectToArgs } from '@/types/redirects'
import { Route } from '@/types/route'

type CreateRouteRedirectsContext = {
  /**
   * The to route for the redirectFrom callback and the from route for the redirectTo callback.
   */
  getRoute: () => Route,
}

export function createRouteRedirects({ getRoute }: CreateRouteRedirectsContext): RouteRedirects {
  const redirectTo: RouteRedirectTo = (...[to, convertParams]) => {
    const from = getRoute()

    if (!isRouteWithRedirect(from)) {
      throw new InvalidRouteRedirectError(from.name)
    }

    to.context.push(from)
    from.context.push(to)

    from.redirect(to, convertParams)
  }

  const redirectFrom: RouteRedirectFrom = (from, convertParams) => {
    const to = getRoute()

    if (!isRouteWithRedirect(from)) {
      throw new InvalidRouteRedirectError(from.name)
    }

    to.context.push(from)
    from.context.push(to)

    from.redirect(to, convertParams)
  }

  return {
    redirectTo,
    redirectFrom,
  }
}
