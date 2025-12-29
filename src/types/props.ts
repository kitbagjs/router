import { CreateRouteOptions, PropsGetter } from '@/types/createRouteOptions'
import { Route } from '@/types/route'
import { RouterReject } from './routerReject'
import { RouterPush } from './routerPush'
import { RouterReplace } from './routerReplace'
import { ExtractRouteContextRejections, ExtractRouteContextRoutes } from './routeContext'
import { ResolvedRoute } from './resolved'
import { RouteUpdate } from './routeUpdate'

/**
 * Context provided to props callback functions
 */
export type PropsCallbackContext<
  TRoute extends Route = Route,
  TOptions extends CreateRouteOptions = CreateRouteOptions
> = {
  reject: RouterReject<ExtractRouteContextRejections<TOptions>>,
  push: RouterPush<[TRoute] | ExtractRouteContextRoutes<TOptions>>,
  replace: RouterReplace<[TRoute] | ExtractRouteContextRoutes<TOptions>>,
  update: RouteUpdate<ResolvedRoute<TRoute>>,
  parent: PropsCallbackParent<TOptions['parent']>,
}

export type PropsCallbackParent<
  TParent extends Route | undefined = Route | undefined
> = Route | undefined extends TParent
  ? undefined | { name: string, props: unknown }
  : TParent extends Route
    ? { name: TParent['name'], props: GetParentPropsReturnType<TParent> }
    : undefined

type GetParentPropsReturnType<
  TParent extends Route | undefined = Route | undefined
> = TParent extends Route
  ? TParent['matched']['props'] extends PropsGetter
    ? ReturnType<TParent['matched']['props']>
    : TParent['matched']['props'] extends Record<string, PropsGetter>
      ? { [K in keyof TParent['matched']['props']]: ReturnType<TParent['matched']['props'][K]> }
      : undefined
  : undefined
