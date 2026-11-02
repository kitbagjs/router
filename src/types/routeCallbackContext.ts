import { ResolvedRoute } from '@/types/resolved'
import { CreatedRouteOptions, Route } from '@/types/route'
import { RouteContextToRejection, RouteContextToRoute } from '@/types/routeContext'
import { RouterPush } from '@/types/routerPush'
import { RouterReject } from '@/types/routerReject'
import { RouterReplace } from '@/types/routerReplace'
import { RouteUpdate } from '@/types/routeUpdate'
import { ParentContext } from '@/types/props'

/**
 * Context provided to a callback attached to a route — an `addView` props getter, or a loader. Sourced
 * from the route: rejections/routes from the route's context, and the parent from the route's `matches`.
 */
export type RouteCallbackContext<
  TRoute extends Route
> = {
  reject: RouterReject<RouteContextToRejection<TRoute['context']>>,
  push: RouterPush<[TRoute] | RouteContextToRoute<TRoute['context']>>,
  replace: RouterReplace<[TRoute] | RouteContextToRoute<TRoute['context']>>,
  update: RouteUpdate<ResolvedRoute<TRoute>>,
  signal: AbortSignal,
  parent: RouteCallbackParent<TRoute>,
}

/**
 * The parent context uses the parent match for its name and views, and includes ancestor loaders.
 */
type RouteCallbackParent<
  TRoute extends Route
> = TRoute['matches'] extends [...infer TParentMatches extends [CreatedRouteOptions, ...CreatedRouteOptions[]], CreatedRouteOptions]
  ? ParentContext<TParentMatches>
  : undefined
