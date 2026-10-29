import { ResolvedRoute } from '@/types/resolved'
import { CreatedRouteOptions, Route } from '@/types/route'
import { ContextRejections, ContextRoutes } from '@/types/routeContext'
import { RouterPush } from '@/types/routerPush'
import { RouterReject } from '@/types/routerReject'
import { RouterReplace } from '@/types/routerReplace'
import { RouteUpdate } from '@/types/routeUpdate'
import { LoadersDataReturnType } from '@/types/routeLoaders'
import { ViewsPropsReturnType } from '@/types/routeViews'

/**
 * Context provided to a callback attached to a route — an `addView` props getter, or a loader. Sourced
 * from the route's context and registered router, and the parent from the route's `matches`.
 */
export type RouteCallbackContext<
  TRoute extends Route
> = {
  reject: RouterReject<ContextRejections<TRoute['context']>>,
  push: RouterPush<[TRoute] | ContextRoutes<TRoute['context']>>,
  replace: RouterReplace<[TRoute] | ContextRoutes<TRoute['context']>>,
  update: RouteUpdate<ResolvedRoute<TRoute>>,
  signal: AbortSignal,
  parent: RouteCallbackParent<TRoute>,
}

/**
 * The parent context ({ name, props, data }) reconstructed from the second-to-last `matches` entry, which
 * carries the parent's name, its views and its loaders.
 */
type RouteCallbackParent<
  TRoute extends Route
> = TRoute['matches'] extends [...CreatedRouteOptions[], infer TParent extends CreatedRouteOptions, CreatedRouteOptions]
  ? {
      name: TParent['name'],
      props: ViewsPropsReturnType<TParent['views']>,
      data: LoadersDataReturnType<TParent['loaders']>,
    }
  : undefined
