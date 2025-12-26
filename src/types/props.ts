import { CreateRouteOptions, PropsGetter } from '@/types/createRouteOptions'
import { Route } from '@/types/route'
import { RouterReject } from './routerReject'
import { RouterPush } from './routerPush'
import { RouterReplace } from './routerReplace'
import { RouteContext, RouteContextToRejection, RouteContextToRoute } from './routeContext'

/**
 * Context provided to props callback functions
 */
export type PropsCallbackContext<
  TOptions extends CreateRouteOptions = CreateRouteOptions
> = {
  reject: RouterReject<RouteContextToRejection<ExtractRouteContext<TOptions>>>,
  push: RouterPush<RouteContextToRoute<ExtractRouteContext<TOptions>>>,
  replace: RouterReplace<RouteContextToRoute<ExtractRouteContext<TOptions>>>,
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
