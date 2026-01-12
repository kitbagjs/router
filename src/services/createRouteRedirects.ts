import { InternalRouteRedirects, RouteRedirectFrom, RouteRedirectTo } from '@/types/redirects'
import { MultipleRouteRedirectsError } from '@/errors/multipleRouteRedirectsError'
import { Route } from '@/types/route'

type CreateRouteRedirectsContext = {
  /**
   * The name of the route that that is being redirected to in the redirectFrom callback.
   */
  getRoute: () => Route & InternalRouteRedirects,
}

export function createRouteRedirects({ getRoute }: CreateRouteRedirectsContext): InternalRouteRedirects {
  const redirectTo: RouteRedirectTo = (to, convertParams) => {
    const from = getRoute()

    const redirects = from.hooks.at(-1)?.redirects

    if (!redirects) {
      throw new Error('Route hooks not found')
    }

    if (redirects.size > 0) {
      throw new MultipleRouteRedirectsError(from.name)
    }

    redirects.add((from, { replace }) => {
      replace(to.name, convertParams(from.params))
    })
  }

  const redirectFrom: RouteRedirectFrom = (from, convertParams) => {
    const to = getRoute()

    const redirects = from.hooks.at(-1)?.redirects

    if (!redirects) {
      throw new Error('Route hooks not found')
    }

    if (redirects.size > 0) {
      throw new MultipleRouteRedirectsError(from.name)
    }

    redirects.add((from, { replace }) => {
      replace(to.name, convertParams(from.params))
    })
  }

  return {
    redirectTo,
    redirectFrom,
  }
}
