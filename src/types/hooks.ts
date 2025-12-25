import { RouterRouteHooks } from '@/models/RouterRouteHooks'
import { ResolvedRoute, RouterResolvedRouteUnion } from '@/types/resolved'
import { MaybePromise } from '@/types/utilities'
import { Routes } from './route'
import { RouterReject } from './routerReject'
import { RouterPush } from './routerPush'
import { RouterReplace } from './routerReplace'
import { Rejection } from './rejection'
import { RouteContext, RouteContextToRejection, RouteContextToRoute } from './routeContext'
import { RouterAbort } from './routerAbort'
import { CallbackContextAbort, CallbackContextPush, CallbackContextReject } from './callbackContext'
import { CallbackContextSuccess } from './callbackContext'

export type InternalRouteHooks<TContext extends RouteContext[] | undefined = undefined> = {
  /**
   * Registers a route hook to be called before the route is entered.
   */
  onBeforeRouteEnter: AddRouterBeforeRouteHook<RouteContextToRoute<TContext>, RouteContextToRejection<TContext>>,
  /**
   * Registers a route hook to be called before the route is left.
   */
  onBeforeRouteLeave: AddRouterBeforeRouteHook<RouteContextToRoute<TContext>, RouteContextToRejection<TContext>>,
  /**
   * Registers a route hook to be called before the route is updated.
   */
  onBeforeRouteUpdate: AddRouterBeforeRouteHook<RouteContextToRoute<TContext>, RouteContextToRejection<TContext>>,
  /**
   * Registers a route hook to be called after the route is entered.
   */
  onAfterRouteEnter: AddRouterAfterRouteHook<RouteContextToRoute<TContext>, RouteContextToRejection<TContext>>,
  /**
   * Registers a route hook to be called after the route is left.
   */
  onAfterRouteLeave: AddRouterAfterRouteHook<RouteContextToRoute<TContext>, RouteContextToRejection<TContext>>,
  /**
   * Registers a route hook to be called after the route is updated.
   */
  onAfterRouteUpdate: AddRouterAfterRouteHook<RouteContextToRoute<TContext>, RouteContextToRejection<TContext>>,
}

export type ExternalRouteHooks<TContext extends RouteContext[] | undefined = undefined> = {
  /**
   * Registers a route hook to be called before the route is entered.
   */
  onBeforeRouteEnter: AddRouterBeforeRouteHook<RouteContextToRoute<TContext>, RouteContextToRejection<TContext>>,
}

export type BeforeHookContext = {
  to: ResolvedRoute,
  from: ResolvedRoute | null,
}

export type RouteHookBeforeRunner = (context: BeforeHookContext) => Promise<BeforeRouteHookResponse>

export type AfterHookContext = {
  to: ResolvedRoute,
  from: ResolvedRoute | null,
}

export type RouteHookAfterRunner = (context: AfterHookContext) => Promise<AfterRouteHookResponse>

export type RouteHookTiming = 'global' | 'component'

type BeforeRouteHookRegistration<
  TRoutes extends Routes,
  TRejections extends Rejection[]
> = {
  lifecycle: 'onBeforeRouteEnter' | 'onBeforeRouteUpdate' | 'onBeforeRouteLeave',
  hook: RouterBeforeRouteHook<TRoutes, TRejections>,
  depth: number,
}

export type AddComponentBeforeRouteHook<
  TRoutes extends Routes = Routes,
  TRejections extends Rejection[] = Rejection[]
> = (hook: BeforeRouteHookRegistration<TRoutes, TRejections>) => RouteHookRemove

type AfterRouteHookRegistration<
  TRoutes extends Routes = Routes,
  TRejections extends Rejection[] = Rejection[]
> = {
  lifecycle: 'onAfterRouteEnter' | 'onAfterRouteUpdate' | 'onAfterRouteLeave',
  hook: RouterAfterRouteHook<TRoutes, TRejections>,
  depth: number,
}

export type AddComponentAfterRouteHook<
  TRoutes extends Routes = Routes,
  TRejections extends Rejection[] = Rejection[]
> = (hook: AfterRouteHookRegistration<TRoutes, TRejections>) => RouteHookRemove

export type AddGlobalRouteHooks = (hooks: RouterRouteHooks) => void

/**
 * A function to remove a previously added route hook.
 */
export type RouteHookRemove = () => void

/**
 * Enumerates the lifecycle events for before route hooks.
 */
export type BeforeRouteHookLifecycle = 'onBeforeRouteEnter' | 'onBeforeRouteUpdate' | 'onBeforeRouteLeave'

/**
 * Enumerates the lifecycle events for after route hooks.
 */
export type AfterRouteHookLifecycle = 'onAfterRouteEnter' | 'onAfterRouteUpdate' | 'onAfterRouteLeave'

/**
 * Union type for all route hook lifecycle events.
 */
export type RouteHookLifecycle = BeforeRouteHookLifecycle | AfterRouteHookLifecycle

type RouterHookContext<
  TRoutes extends Routes,
  TRejections extends Rejection[]
> = {
  from: RouterResolvedRouteUnion<TRoutes> | null,
  reject: RouterReject<TRejections>,
  push: RouterPush<TRoutes>,
  replace: RouterReplace<TRoutes>,
}

type RouterBeforeRouteHookContext<
  TRoutes extends Routes,
  TRejections extends Rejection[]
> = RouterHookContext<TRoutes, TRejections> & {
  abort: RouterAbort,
}

export type HookContext<TRoutes extends Routes = Routes> = {
  to: RouterResolvedRouteUnion<TRoutes>,
  from: RouterResolvedRouteUnion<TRoutes> | null,
}

export type RouterBeforeRouteHook<
  TRoutes extends Routes = Routes,
  TRejections extends Rejection[] = Rejection[]
> = (to: RouterResolvedRouteUnion<TRoutes>, context: RouterBeforeRouteHookContext<TRoutes, TRejections>) => MaybePromise<void>

export type AddRouterBeforeRouteHook<
  TRoutes extends Routes = Routes,
  TRejections extends Rejection[] = Rejection[]
> = (hook: RouterBeforeRouteHook<TRoutes, TRejections>) => RouteHookRemove

type RouterAfterRouteHookContext<
  TRoutes extends Routes = Routes,
  TRejections extends Rejection[] = Rejection[]
> = RouterHookContext<TRoutes, TRejections>

export type RouterAfterRouteHook<
  TRoutes extends Routes = Routes,
  TRejections extends Rejection[] = Rejection[]
> = (to: RouterResolvedRouteUnion<TRoutes>, context: RouterAfterRouteHookContext<TRoutes, TRejections>) => MaybePromise<void>

export type AddRouterAfterRouteHook<
  TRoutes extends Routes = Routes,
  TRejections extends Rejection[] = Rejection[]
> = (hook: RouterAfterRouteHook<TRoutes, TRejections>) => RouteHookRemove

export type BeforeRouteHookResponse = CallbackContextSuccess | CallbackContextPush | CallbackContextReject | CallbackContextAbort
export type AfterRouteHookResponse = CallbackContextSuccess | CallbackContextPush | CallbackContextReject

export type RouterRouteHookBeforeRunner = (context: HookContext) => Promise<BeforeRouteHookResponse>
export type RouterRouteHookAfterRunner = (context: HookContext) => Promise<AfterRouteHookResponse>

export type RouterErrorHookContext<
  TRoutes extends Routes = Routes,
  TRejections extends Rejection[] = Rejection[]
> = {
  to: RouterResolvedRouteUnion<TRoutes>,
  from: RouterResolvedRouteUnion<TRoutes> | null,
  source: 'props' | 'hook' | 'component',
  reject: RouterReject<TRejections>,
  push: RouterPush<TRoutes>,
  replace: RouterReplace<TRoutes>,
}

export type RouterErrorHook<
  TRoutes extends Routes = Routes,
  TRejections extends Rejection[] = Rejection[]
> = (error: unknown, context: RouterErrorHookContext<TRoutes, TRejections>) => void

export type AddRouterErrorHook<
  TRoutes extends Routes = Routes,
  TRejections extends Rejection[] = Rejection[]
> = (hook: RouterErrorHook<TRoutes, TRejections>) => RouteHookRemove

export type RouterRouteHookErrorRunnerContext<TRoutes extends Routes = Routes> = {
  to: RouterResolvedRouteUnion<TRoutes>,
  from: RouterResolvedRouteUnion<TRoutes> | null,
  source: 'props' | 'hook',
}

export type RouterRouteHookErrorRunner = (error: unknown, context: RouterRouteHookErrorRunnerContext) => void
