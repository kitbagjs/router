import { Hooks } from '@/models/hooks'
import { ResolvedRoute, RouterResolvedRouteUnion, ResolvedRouteUnion } from '@/types/resolved'
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
  onBeforeRouteEnter: AddBeforeEnterHook<TRoute, Route, [TRoute] | RouteContextToRoute<TContext>, RouteContextToRejection<TContext>>,
  /**
   * Registers a route hook to be called before the route is left.
   */
  onBeforeRouteLeave: AddBeforeLeaveHook<Route, TRoute, [TRoute] | RouteContextToRoute<TContext>, RouteContextToRejection<TContext>>,
  /**
   * Registers a route hook to be called before the route is updated.
   */
  onBeforeRouteUpdate: AddBeforeUpdateHook<TRoute, Route, [TRoute] | RouteContextToRoute<TContext>, RouteContextToRejection<TContext>>,
  /**
   * Registers a route hook to be called after the route is entered.
   */
  onAfterRouteEnter: AddAfterEnterHook<TRoute, Route, [TRoute] | RouteContextToRoute<TContext>, RouteContextToRejection<TContext>>,
  /**
   * Registers a route hook to be called after the route is left.
   */
  onAfterRouteLeave: AddAfterLeaveHook<Route, TRoute, [TRoute] | RouteContextToRoute<TContext>, RouteContextToRejection<TContext>>,
  /**
   * Registers a route hook to be called after the route is updated.
   */
  onAfterRouteUpdate: AddAfterUpdateHook<TRoute, Route, [TRoute] | RouteContextToRoute<TContext>, RouteContextToRejection<TContext>>,
}

export type ExternalRouteHooks<
  TRoute extends Route = Route,
  TContext extends RouteContext[] | undefined = undefined
> = {
  /**
   * Registers a route hook to be called before the route is entered.
   */
  onBeforeRouteEnter: AddBeforeEnterHook<TRoute, Route, [TRoute] | RouteContextToRoute<TContext>, RouteContextToRejection<TContext>>,
}

export type HookTiming = 'global' | 'component'

/**
 * Union type for all component route hooks.
 */
export type ComponentHook = BeforeEnterHook | BeforeUpdateHook | BeforeLeaveHook | AfterEnterHook | AfterUpdateHook | AfterLeaveHook

/**
 * Registration object for adding a component route hook.
 */
export type ComponentHookRegistration = {
  lifecycle: HookLifecycle,
  hook: ComponentHook,
  depth: number,
}

/**
 * Function to add a component route hook with depth-based condition checking.
 */
export type AddComponentHook = (registration: ComponentHookRegistration) => HookRemove

// Legacy types kept for backward compatibility - deprecated, use AddComponentHook instead
export type BeforeHookRegistration<
  TRouteTo extends Route = Route,
  TRouteFrom extends Route = Route,
  TRoutes extends Routes = Routes,
  TRejections extends Rejections = Rejections
> =
  | {
    lifecycle: 'onBeforeRouteEnter',
    hook: BeforeEnterHook<TRouteTo, TRouteFrom, TRoutes, TRejections>,
    depth: number,
  }
  | {
    lifecycle: 'onBeforeRouteUpdate',
    hook: BeforeUpdateHook<TRouteTo, TRouteFrom, TRoutes, TRejections>,
    depth: number,
  }
  | {
    lifecycle: 'onBeforeRouteLeave',
    hook: BeforeLeaveHook<TRouteTo, TRouteFrom, TRoutes, TRejections>,
    depth: number,
  }

/** @deprecated Use AddComponentHook instead */
export type AddComponentBeforeHook<
  TRouteTo extends Route = Route,
  TRouteFrom extends Route = Route,
  TRoutes extends Routes = Routes,
  TRejections extends Rejections = Rejections
> = (hook: BeforeHookRegistration<TRouteTo, TRouteFrom, TRoutes, TRejections>) => HookRemove

export type AfterHookRegistration<
  TRouteTo extends Route = Route,
  TRouteFrom extends Route = Route,
  TRoutes extends Routes = Routes,
  TRejections extends Rejections = Rejections
> =
  | {
    lifecycle: 'onAfterRouteEnter',
    hook: AfterEnterHook<TRouteTo, TRouteFrom, TRoutes, TRejections>,
    depth: number,
  }
  | {
    lifecycle: 'onAfterRouteUpdate',
    hook: AfterUpdateHook<TRouteTo, TRouteFrom, TRoutes, TRejections>,
    depth: number,
  }
  | {
    lifecycle: 'onAfterRouteLeave',
    hook: AfterLeaveHook<TRouteTo, TRouteFrom, TRoutes, TRejections>,
    depth: number,
  }

/** @deprecated Use AddComponentHook instead */
export type AddComponentAfterHook<
  TRouteTo extends Route = Route,
  TRouteFrom extends Route = Route,
  TRoutes extends Routes = Routes,
  TRejections extends Rejections = Rejections
> = (hook: AfterHookRegistration<TRouteTo, TRouteFrom, TRoutes, TRejections>) => HookRemove

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
  reject: RouterReject<TRejections>,
  push: RouterPush<TRoutes>,
  replace: RouterReplace<TRoutes>,
  update: RouteUpdate<ResolvedRouteUnion<TRoute>>,
}

type BeforeHookContext<
  TRouteTo extends Route,
  TRoutes extends Routes,
  TRejections extends Rejections
> = {
  reject: RouterReject<TRejections>,
  push: RouterPush<TRoutes>,
  replace: RouterReplace<TRoutes>,
  update: RouteUpdate<ResolvedRouteUnion<TRouteTo>>,
  abort: RouterAbort,
}

export type BeforeEnterHookContext<
  TRouteTo extends Route = Route,
  TRouteFrom extends Route = Route,
  TRoutes extends Routes = Routes,
  TRejections extends Rejections = Rejections
> = BeforeHookContext<TRouteTo, TRoutes, TRejections> & {
  from: ResolvedRouteUnion<TRouteFrom> | null,
}

export type BeforeEnterHook<
  TRouteTo extends Route = Route,
  TRouteFrom extends Route = Route,
  TRoutes extends Routes = Routes,
  TRejections extends Rejections = Rejections
> = (to: ResolvedRouteUnion<TRouteTo>, context: BeforeEnterHookContext<TRouteTo, TRouteFrom, TRoutes, TRejections>) => MaybePromise<void>

export type AddBeforeEnterHook<
  TRouteTo extends Route = Route,
  TRouteFrom extends Route = Route,
  TRoutes extends Routes = Routes,
  TRejections extends Rejections = Rejections
> = (hook: BeforeEnterHook<TRouteTo, TRouteFrom, TRoutes, TRejections>) => HookRemove

export type BeforeUpdateHookContext<
  TRouteTo extends Route = Route,
  TRouteFrom extends Route = Route,
  TRoutes extends Routes = Routes,
  TRejections extends Rejections = Rejections
> = BeforeHookContext<TRouteTo, TRoutes, TRejections> & {
  from: ResolvedRouteUnion<TRouteFrom> | null,
}

export type BeforeUpdateHook<
  TRouteTo extends Route = Route,
  TRouteFrom extends Route = Route,
  TRoutes extends Routes = Routes,
  TRejections extends Rejections = Rejections
> = (to: ResolvedRouteUnion<TRouteTo>, context: BeforeUpdateHookContext<TRouteTo, TRouteFrom, TRoutes, TRejections>) => MaybePromise<void>

export type AddBeforeUpdateHook<
  TRouteTo extends Route = Route,
  TRouteFrom extends Route = Route,
  TRoutes extends Routes = Routes,
  TRejections extends Rejections = Rejections
> = (hook: BeforeUpdateHook<TRouteTo, TRouteFrom, TRoutes, TRejections>) => HookRemove

export type BeforeLeaveHookContext<
  TRouteTo extends Route = Route,
  TRouteFrom extends Route = Route,
  TRoutes extends Routes = Routes,
  TRejections extends Rejections = Rejections
> = BeforeHookContext<TRouteTo, TRoutes, TRejections> & {
  from: ResolvedRouteUnion<TRouteFrom>,
}

export type BeforeLeaveHook<
  TRouteTo extends Route = Route,
  TRouteFrom extends Route = Route,
  TRoutes extends Routes = Routes,
  TRejections extends Rejections = Rejections
> = (to: ResolvedRouteUnion<TRouteTo>, context: BeforeLeaveHookContext<TRouteTo, TRouteFrom, TRoutes, TRejections>) => MaybePromise<void>

export type AddBeforeLeaveHook<
  TRouteTo extends Route = Route,
  TRouteFrom extends Route = Route,
  TRoutes extends Routes = Routes,
  TRejections extends Rejections = Rejections
> = (hook: BeforeLeaveHook<TRouteTo, TRouteFrom, TRoutes, TRejections>) => HookRemove

export type AfterEnterHookContext<
  TRouteTo extends Route = Route,
  TRouteFrom extends Route = Route,
  TRoutes extends Routes = Routes,
  TRejections extends Rejections = Rejections
> = AfterHookContext<TRouteTo, TRoutes, TRejections> & {
  from: ResolvedRouteUnion<TRouteFrom> | null,
}

export type AfterEnterHook<
  TRouteTo extends Route = Route,
  TRouteFrom extends Route = Route,
  TRoutes extends Routes = Routes,
  TRejections extends Rejections = Rejections
> = (to: ResolvedRouteUnion<TRouteTo>, context: AfterEnterHookContext<TRouteTo, TRouteFrom, TRoutes, TRejections>) => MaybePromise<void>

export type AddAfterEnterHook<
  TRouteTo extends Route = Route,
  TRouteFrom extends Route = Route,
  TRoutes extends Routes = Routes,
  TRejections extends Rejections = Rejections
> = (hook: AfterEnterHook<TRouteTo, TRouteFrom, TRoutes, TRejections>) => HookRemove

export type AfterUpdateHookContext<
  TRouteTo extends Route = Route,
  TRouteFrom extends Route = Route,
  TRoutes extends Routes = Routes,
  TRejections extends Rejections = Rejections
> = AfterHookContext<TRouteTo, TRoutes, TRejections> & {
  from: ResolvedRouteUnion<TRouteFrom> | null,
}

export type AfterUpdateHook<
  TRouteTo extends Route = Route,
  TRouteFrom extends Route = Route,
  TRoutes extends Routes = Routes,
  TRejections extends Rejections = Rejections
> = (to: ResolvedRouteUnion<TRouteTo>, context: AfterUpdateHookContext<TRouteTo, TRouteFrom, TRoutes, TRejections>) => MaybePromise<void>

export type AddAfterUpdateHook<
  TRouteTo extends Route = Route,
  TRouteFrom extends Route = Route,
  TRoutes extends Routes = Routes,
  TRejections extends Rejections = Rejections
> = (hook: AfterUpdateHook<TRouteTo, TRouteFrom, TRoutes, TRejections>) => HookRemove

export type AfterLeaveHookContext<
  TRouteTo extends Route = Route,
  TRouteFrom extends Route = Route,
  TRoutes extends Routes = Routes,
  TRejections extends Rejections = Rejections
> = AfterHookContext<TRouteTo, TRoutes, TRejections> & {
  from: ResolvedRouteUnion<TRouteFrom>,
}

export type AfterLeaveHook<
  TRouteTo extends Route = Route,
  TRouteFrom extends Route = Route,
  TRoutes extends Routes = Routes,
  TRejections extends Rejections = Rejections
> = (to: ResolvedRouteUnion<TRouteTo>, context: AfterLeaveHookContext<TRouteTo, TRouteFrom, TRoutes, TRejections>) => MaybePromise<void>

export type AddAfterLeaveHook<
  TRouteTo extends Route = Route,
  TRouteFrom extends Route = Route,
  TRoutes extends Routes = Routes,
  TRejections extends Rejections = Rejections
> = (hook: AfterLeaveHook<TRouteTo, TRouteFrom, TRoutes, TRejections>) => HookRemove

export type AddBeforeHook<
  TRouteTo extends Route = Route,
  TRouteFrom extends Route = Route,
  TRoutes extends Routes = Routes,
  TRejections extends Rejections = Rejections
> = (hook: BeforeEnterHook<TRouteTo, TRouteFrom, TRoutes, TRejections> | BeforeUpdateHook<TRouteTo, TRouteFrom, TRoutes, TRejections> | BeforeLeaveHook<TRouteTo, TRouteFrom, TRoutes, TRejections>) => HookRemove

export type AddAfterHook<
  TRouteTo extends Route = Route,
  TRouteFrom extends Route = Route,
  TRoutes extends Routes = Routes,
  TRejections extends Rejections = Rejections
> = (hook: AfterEnterHook<TRouteTo, TRouteFrom, TRoutes, TRejections> | AfterUpdateHook<TRouteTo, TRouteFrom, TRoutes, TRejections> | AfterLeaveHook<TRouteTo, TRouteFrom, TRoutes, TRejections>) => HookRemove

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
