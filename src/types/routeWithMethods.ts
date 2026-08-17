import { RouteAddLoader } from '@/types/addLoader'
import { RouteAddView } from '@/types/addView'
import { InternalRouteHooks } from '@/types/hooks'
import { RouteRedirects } from '@/types/redirects'
import { CreatedRouteOptions, Route } from '@/types/route'
import { RouteSetTitle } from '@/types/routeTitle'
import { Url } from '@/types/url'

/**
 * A route plus every chainable/available method: addView, addLoader, hooks, redirects, and title. The type
 * level counterpart to `withRouteMethods`.
 *
 * Takes the url and matches rather than an assembled route so that adding a view or a loader can rebuild
 * from them directly. Taking the route would mean re-deriving the url from it on every call, and that
 * reference is what made chained calls nest one inside the last.
 */
export type RouteWithMethods<
  TUrl extends Url = Url,
  TMatches extends CreatedRouteOptions[] = CreatedRouteOptions[]
> = Route<TUrl, TMatches>
  & RouteAddView<TUrl, TMatches>
  & RouteAddLoader<TUrl, TMatches>
  & InternalRouteHooks<Route<TUrl, TMatches>, Route<TUrl, TMatches>['context']>
  & RouteRedirects<Route<TUrl, TMatches>>
  & RouteSetTitle<Route<TUrl, TMatches>>
