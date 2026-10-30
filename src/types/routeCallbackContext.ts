import { ResolvedRoute } from '@/types/resolved'
import { CreatedRouteOptions, Route } from '@/types/route'
import { RouteContextToRejection, RouteContextToRoute } from '@/types/routeContext'
import { RouterPush } from '@/types/routerPush'
import { RouterReject } from '@/types/routerReject'
import { RouterReplace } from '@/types/routerReplace'
import { RouteUpdate } from '@/types/routeUpdate'
import { GetData, LoadersData, LoadersDataReturnType } from '@/types/routeLoaders'
import { GetProps, ViewsProps, ViewsPropsReturnType } from '@/types/routeViews'

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
 * The parent context ({ name, props, data }) reconstructed from the second-to-last `matches` entry, which
 * carries the parent's name, its views and its loaders.
 */
type RouteCallbackParent<
  TRoute extends Route
> = TRoute['matches'] extends [...CreatedRouteOptions[], infer TParent extends CreatedRouteOptions, CreatedRouteOptions]
  ? {
      name: TParent['name'],
      getData: GetData<LoadersData<TParent['loaders']>>,
      getProps: GetProps<ViewsProps<TParent['views']>>,
      /** @deprecated Use parent.getProps() or parent.getProps(name). */
      props: ViewsPropsReturnType<TParent['views']>,
      /** @deprecated Use parent.getData() or parent.getData(name). */
      data: LoadersDataReturnType<TParent['loaders']>,
    }
  : undefined
