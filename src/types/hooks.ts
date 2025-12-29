import { Hooks } from '@/models/hooks'
import { ResolvedRoute, RouterResolvedRouteUnion } from '@/types/resolved'
import { MaybePromise } from '@/types/utilities'
import { Route, Routes } from './route'
import { RouterReject } from './routerReject'
import { RouterPush } from './routerPush'
import { RouterReplace } from './routerReplace'
import { Rejections } from './rejection'
import { RouteContext, RouteContextToRejection, RouteContextToRoute } from './routeContext'
import { RouterAbort } from './routerAbort'
import { CallbackContextAbort, CallbackContextPush, CallbackContextReject, CallbackContextSuccess } from './callbackContext'
import { RouteUpdate } from './routeUpdate'

export type InternalRouteHooks<
  TRoute extends Route = Route,
  TContext extends RouteContext[] | undefined = undefined
> = {
  /**
   * Registers a route hook to be called before the route is entered.
   */
  onBeforeRouteEnter: AddBeforeHook<TRoute, [TRoute] | RouteContextToRoute<TContext>, RouteContextToRejection<TContext>>,
  /**
   * Registers a route hook to be called before the route is left.
   */
  onBeforeRouteLeave: AddBeforeHook<TRoute, [TRoute] | RouteContextToRoute<TContext>, RouteContextToRejection<TContext>>,
  /**
   * Registers a route hook to be called before the route is updated.
   */
  onBeforeRouteUpdate: AddBeforeHook<TRoute, [TRoute] | RouteContextToRoute<TContext>, RouteContextToRejection<TContext>>,
  /**
   * Registers a route hook to be called after the route is entered.
   */
  onAfterRouteEnter: AddAfterHook<TRoute, [TRoute] | RouteContextToRoute<TContext>, RouteContextToRejection<TContext>>,
  /**
   * Registers a route hook to be called after the route is left.
   */
  onAfterRouteLeave: AddAfterHook<TRoute, [TRoute] | RouteContextToRoute<TContext>, RouteContextToRejection<TContext>>,
  /**
   * Registers a route hook to be called after the route is updated.
   */
  onAfterRouteUpdate: AddAfterHook<TRoute, [TRoute] | RouteContextToRoute<TContext>, RouteContextToRejection<TContext>>,
}

export type ExternalRouteHooks<
  TRoute extends Route = Route,
  TContext extends RouteContext[] | undefined = undefined
> = {
  /**
   * Registers a route hook to be called before the route is entered.
   */
  onBeforeRouteEnter: AddBeforeHook<TRoute, [TRoute] | RouteContextToRoute<TContext>, RouteContextToRejection<TContext>>,
}

export type HookTiming = 'global' | 'component'

type BeforeHookRegistration<
  TRoute extends Route,
  TRoutes extends Routes,
  TRejections extends Rejections
> = {
  lifecycle: 'onBeforeRouteEnter' | 'onBeforeRouteUpdate' | 'onBeforeRouteLeave',
  hook: BeforeHook<TRoute, TRoutes, TRejections>,
  depth: number,
}

export type AddComponentBeforeHook<
  TRoute extends Route = Route,
  TRoutes extends Routes = Routes,
  TRejections extends Rejections = Rejections
> = (hook: BeforeHookRegistration<TRoute, TRoutes, TRejections>) => HookRemove

type AfterHookRegistration<
  TRoute extends Route = Route,
  TRoutes extends Routes = Routes,
  TRejections extends Rejections = Rejections
> = {
  lifecycle: 'onAfterRouteEnter' | 'onAfterRouteUpdate' | 'onAfterRouteLeave',
  hook: AfterHook<TRoute, TRoutes, TRejections>,
  depth: number,
}

export type AddComponentAfterHook<
  TRoute extends Route = Route,
  TRoutes extends Routes = Routes,
  TRejections extends Rejections = Rejections
> = (hook: AfterHookRegistration<TRoute, TRoutes, TRejections>) => HookRemove

export type AddGlobalHooks = (hooks: Hooks) => void

/**
 * A function to remove a previously added route hook.
 */
export type HookRemove = () => void

/**
 * Enumerates the lifecycle events for before route hooks.
 */
export type BeforeHookLifecycle = 'onBeforeRouteEnter' | 'onBeforeRouteUpdate' | 'onBeforeRouteLeave'

/**
 * Enumerates the lifecycle events for after route hooks.
 */
export type AfterHookLifecycle = 'onAfterRouteEnter' | 'onAfterRouteUpdate' | 'onAfterRouteLeave'

/**
 * Union type for all route hook lifecycle events.
 */
export type HookLifecycle = BeforeHookLifecycle | AfterHookLifecycle

type AfterHookContext<
  TRoute extends Route,
  TRoutes extends Routes,
  TRejections extends Rejections
> = {
  from: RouterResolvedRouteUnion<TRoutes> | null,
  reject: RouterReject<TRejections>,
  push: RouterPush<TRoutes>,
  replace: RouterReplace<TRoutes>,
  update: RouteUpdate<ResolvedRoute<TRoute>>,
}

type BeforeHookContext<
  TRoute extends Route,
  TRoutes extends Routes,
  TRejections extends Rejections
> = {
  from: RouterResolvedRouteUnion<TRoutes> | null,
  reject: RouterReject<TRejections>,
  push: RouterPush<TRoutes>,
  replace: RouterReplace<TRoutes>,
  update: RouteUpdate<ResolvedRoute<TRoute>>,
  abort: RouterAbort,
}

export type BeforeHook<
  TRoute extends Route = Route,
  TRoutes extends Routes = Routes,
  TRejections extends Rejections = Rejections
> = (to: RouterResolvedRouteUnion<TRoutes>, context: BeforeHookContext<TRoute, TRoutes, TRejections>) => MaybePromise<void>

export type AddBeforeHook<
  TRoute extends Route = Route,
  TRoutes extends Routes = Routes,
  TRejections extends Rejections = Rejections
> = (hook: BeforeHook<TRoute, TRoutes, TRejections>) => HookRemove

export type AfterHook<
  TRoute extends Route = Route,
  TRoutes extends Routes = Routes,
  TRejections extends Rejections = Rejections
> = (to: RouterResolvedRouteUnion<TRoutes>, context: AfterHookContext<TRoute, TRoutes, TRejections>) => MaybePromise<void>

export type AddAfterHook<
  TRoute extends Route = Route,
  TRoutes extends Routes = Routes,
  TRejections extends Rejections = Rejections
> = (hook: AfterHook<TRoute, TRoutes, TRejections>) => HookRemove

export type BeforeHookResponse = CallbackContextSuccess | CallbackContextPush | CallbackContextReject | CallbackContextAbort
export type AfterHookResponse = CallbackContextSuccess | CallbackContextPush | CallbackContextReject

export type BeforeHookRunner = <TRoutes extends Routes>(context: { to: RouterResolvedRouteUnion<TRoutes>, from: RouterResolvedRouteUnion<TRoutes> | null }) => Promise<BeforeHookResponse>
export type AfterHookRunner = <TRoutes extends Routes>(context: { to: RouterResolvedRouteUnion<TRoutes>, from: RouterResolvedRouteUnion<TRoutes> | null }) => Promise<AfterHookResponse>

export type ErrorHookContext<
  TRoute extends Route = Route,
  TRoutes extends Routes = Routes,
  TRejections extends Rejections = Rejections
> = {
  to: RouterResolvedRouteUnion<TRoutes>,
  from: RouterResolvedRouteUnion<TRoutes> | null,
  source: 'props' | 'hook' | 'component',
  reject: RouterReject<TRejections>,
  push: RouterPush<TRoutes>,
  replace: RouterReplace<TRoutes>,
  update: RouteUpdate<ResolvedRoute<TRoute>>,
}

export type ErrorHook<
  TRoute extends Route = Route,
  TRoutes extends Routes = Routes,
  TRejections extends Rejections = Rejections
> = (error: unknown, context: ErrorHookContext<TRoute, TRoutes, TRejections>) => void

export type AddErrorHook<
  TRoute extends Route = Route,
  TRoutes extends Routes = Routes,
  TRejections extends Rejections = Rejections
> = (hook: ErrorHook<TRoute, TRoutes, TRejections>) => HookRemove

export type ErrorHookRunnerContext<TRoutes extends Routes = Routes> = {
  to: RouterResolvedRouteUnion<TRoutes>,
  from: RouterResolvedRouteUnion<TRoutes> | null,
  source: 'props' | 'hook',
}

export type ErrorHookRunner = (error: unknown, context: ErrorHookRunnerContext) => void
