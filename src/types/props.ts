import { CreateRouteOptions, PropsGetter } from '@/types/createRouteOptions'
import { Route } from '@/types/route'
import { RouterReject } from './routerReject'
import { RouterPush } from './routerPush'
import { RouterReplace } from './routerReplace'
import { RouteContext, RouteContextToRejection, RouteContextToRoute } from './routeContext'
import { ResolvedRoute } from './resolved'
import { RouteUpdate } from './routeUpdate'

/**
 * Context provided to props callback functions
 */
export type PropsCallbackContext<
  TRoute extends Route = Route,
  TOptions extends CreateRouteOptions = CreateRouteOptions
> = {
  reject: RouterReject<RouteContextToRejection<ExtractRouteContext<TOptions>>>,
  push: RouterPush<RouteContextToRoute<ExtractRouteContext<TOptions>>>,
  replace: RouterReplace<RouteContextToRoute<ExtractRouteContext<TOptions>>>,
  update: RouteUpdate<ResolvedRoute<TRoute>>,
  parent: PropsCallbackParent<TOptions['parent']>,
}

type ExtractRouteContext<
  TOptions extends CreateRouteOptions
> = TOptions extends { context: infer TContext extends RouteContext[] }
  ? TContext
  : []

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
