import { ResolvedRoute, WithData } from '@/types/resolved'
import { CreatedRouteOptions, Route } from '@/types/route'
import { RouteCallbackParent } from '@/types/routeCallbackContext'
import { RouteWithMethods } from '@/types/routeWithMethods'
import { Tags } from '@/types/tags'
import { Url } from '@/types/url'
import { MaybePromise } from '@/types/utilities'

export type SetRouteTagsContext<TRoute extends Route = Route> = {
  to: ResolvedRoute<TRoute> & WithData<TRoute>,
  signal: AbortSignal,
  parent: RouteCallbackParent<TRoute>,
}

export type SetRouteTagsCallback<TRoute extends Route = Route> = (tags: Tags, context: SetRouteTagsContext<TRoute>) => MaybePromise<void>

export type SetRouteTags<TRoute extends Route = Route, TReturn = void> = (callback: SetRouteTagsCallback<TRoute>) => TReturn

export type RouteTags<
  TUrl extends Url = Url,
  TMatches extends CreatedRouteOptions[] = CreatedRouteOptions[]
> = {
  /** Computes document tags for this route using its loader data and inherited tags. */
  setTags: SetRouteTags<Route<TUrl, TMatches>, RouteWithMethods<TUrl, TMatches>>,
}
