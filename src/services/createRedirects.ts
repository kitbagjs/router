import { AddRedirectHook } from '@/types/hooks'
import { InternalRouteRedirects, RouteRedirectFrom, RouteRedirectTo } from '@/types/redirects'

type CreateRedirectsContext = {
  /**
   * The name of the route that that is being redirected to in the redirectFrom callback.
   */
  routeToName: string,
  /**
   * The callback for adding a redirect to the route being redirected from in the redirectTo hook
   */
  addRedirectHook: AddRedirectHook,
}

export function createRedirects({ routeToName, addRedirectHook }: CreateRedirectsContext): InternalRouteRedirects {
  const redirectTo: RouteRedirectTo = (to, convertParams) => {
    addRedirectHook((from, { replace }) => {
      replace(to.name, convertParams(from.params))
    })
  }

  const redirectFrom: RouteRedirectFrom = (fromRoute, convertParams) => {
    fromRoute.redirect((from, { replace }) => {
      replace(routeToName, convertParams(from.params))
    })
  }

  return {
    redirectTo,
    redirectFrom,
  }
}
