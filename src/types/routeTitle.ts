import { ResolvedRouteUnion } from '@/types/resolved'
import { Route, CreatedRouteOptions } from './route'
import { RouteWithMethods } from '@/types/routeWithMethods'
import { Url } from '@/types/url'
import { MaybePromise } from './utilities'
import { RouteCallbackParent } from '@/types/routeCallbackContext'

export type GetTitleCallback = () => Promise<string | undefined>

export type SetRouteTitleContext<TRoute extends Route = Route> = {
  signal: AbortSignal,
  parent: RouteCallbackParent<TRoute>,
  /**
   * @deprecated Use parent.getTitle() instead.
   */
  getParentTitle: GetTitleCallback,
}

export type SetRouteTitleCallback<TRoute extends Route = Route> = (to: ResolvedRouteUnion<TRoute>, context: SetRouteTitleContext<TRoute>) => MaybePromise<string>
export type GetRouteTitle<TRoute extends Route = Route> = (to: ResolvedRouteUnion<TRoute>) => Promise<string | undefined>
export type SetRouteTitle<TRoute extends Route = Route, TReturn = void> = (callback: SetRouteTitleCallback<TRoute>) => TReturn

export type RouteSetTitle<TRoute extends Route = Route> = {
  /**
   * Adds a callback to set the document title for the route.
   */
  setTitle: SetRouteTitle<TRoute>,
}

export type RouteTitle<
  TUrl extends Url = Url,
  TMatches extends CreatedRouteOptions[] = CreatedRouteOptions[]
> = {
  setTitle: SetRouteTitle<Route<TUrl, TMatches>, RouteWithMethods<TUrl, TMatches>>,
}
