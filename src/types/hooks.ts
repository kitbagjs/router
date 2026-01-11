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
  onBeforeRouteEnter: AddBeforeEnterHook<[TRoute] | RouteContextToRoute<TContext>, RouteContextToRejection<TContext>, TRoute, Route>,
  /**
   * Registers a route hook to be called before the route is left.
   */
  onBeforeRouteLeave: AddBeforeLeaveHook<[TRoute] | RouteContextToRoute<TContext>, RouteContextToRejection<TContext>, Route, TRoute>,
  /**
   * Registers a route hook to be called before the route is updated.
   */
  onBeforeRouteUpdate: AddBeforeUpdateHook<[TRoute] | RouteContextToRoute<TContext>, RouteContextToRejection<TContext>, TRoute, Route>,
  /**
   * Registers a route hook to be called after the route is entered.
   */
  onAfterRouteEnter: AddAfterEnterHook<[TRoute] | RouteContextToRoute<TContext>, RouteContextToRejection<TContext>, TRoute, Route>,
  /**
   * Registers a route hook to be called after the route is left.
   */
  onAfterRouteLeave: AddAfterLeaveHook<[TRoute] | RouteContextToRoute<TContext>, RouteContextToRejection<TContext>, Route, TRoute>,
  /**
   * Registers a route hook to be called after the route is updated.
   */
  onAfterRouteUpdate: AddAfterUpdateHook<[TRoute] | RouteContextToRoute<TContext>, RouteContextToRejection<TContext>, TRoute, Route>,
}

export type ExternalRouteHooks<
  TRoute extends Route = Route,
  TContext extends RouteContext[] | undefined = undefined
> = {
  /**
   * Registers a route hook to be called before the route is entered.
   */
  onBeforeRouteEnter: AddBeforeEnterHook<[TRoute] | RouteContextToRoute<TContext>, RouteContextToRejection<TContext>, TRoute, Route>,
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

type RedirectHookContext<
  TRoutes extends Routes
> = {
  replace: RouterReplace<TRoutes>,
}

export type RedirectHook<
  TRoutes extends Routes = Routes,
  TRouteTo extends Route = TRoutes[number]
> = (to: ResolvedRouteUnion<TRouteTo>, context: RedirectHookContext<TRoutes>) => MaybePromise<void>

export type AddRedirectHook<
  TRoutes extends Routes = Routes,
  TRouteTo extends Route = TRoutes[number]
> = (hook: RedirectHook<TRoutes, TRouteTo>) => HookRemove

export type BeforeEnterHookContext<
  TRoutes extends Routes = Routes,
  TRejections extends Rejections = Rejections,
  TRouteTo extends Route = TRoutes[number],
  TRouteFrom extends Route = TRoutes[number]
> = BeforeHookContext<TRouteTo, TRoutes, TRejections> & {
  from: ResolvedRouteUnion<TRouteFrom> | null,
}

export type BeforeEnterHook<
  TRoutes extends Routes = Routes,
  TRejections extends Rejections = Rejections,
  TRouteTo extends Route = TRoutes[number],
  TRouteFrom extends Route = TRoutes[number]
> = (to: ResolvedRouteUnion<TRouteTo>, context: BeforeEnterHookContext<TRoutes, TRejections, TRouteTo, TRouteFrom>) => MaybePromise<void>

export type AddBeforeEnterHook<
  TRoutes extends Routes = Routes,
  TRejections extends Rejections = Rejections,
  TRouteTo extends Route = TRoutes[number],
  TRouteFrom extends Route = TRoutes[number]
> = (hook: BeforeEnterHook<TRoutes, TRejections, TRouteTo, TRouteFrom>) => HookRemove

export type BeforeUpdateHookContext<
  TRoutes extends Routes = Routes,
  TRejections extends Rejections = Rejections,
  TRouteTo extends Route = TRoutes[number],
  TRouteFrom extends Route = TRoutes[number]
> = BeforeHookContext<TRouteTo, TRoutes, TRejections> & {
  from: ResolvedRouteUnion<TRouteFrom> | null,
}

export type BeforeUpdateHook<
  TRoutes extends Routes = Routes,
  TRejections extends Rejections = Rejections,
  TRouteTo extends Route = TRoutes[number],
  TRouteFrom extends Route = TRoutes[number]
> = (to: ResolvedRouteUnion<TRouteTo>, context: BeforeUpdateHookContext<TRoutes, TRejections, TRouteTo, TRouteFrom>) => MaybePromise<void>

export type AddBeforeUpdateHook<
  TRoutes extends Routes = Routes,
  TRejections extends Rejections = Rejections,
  TRouteTo extends Route = TRoutes[number],
  TRouteFrom extends Route = TRoutes[number]
> = (hook: BeforeUpdateHook<TRoutes, TRejections, TRouteTo, TRouteFrom>) => HookRemove

export type BeforeLeaveHookContext<
  TRoutes extends Routes = Routes,
  TRejections extends Rejections = Rejections,
  TRouteTo extends Route = TRoutes[number],
  TRouteFrom extends Route = TRoutes[number]
> = BeforeHookContext<TRouteTo, TRoutes, TRejections> & {
  from: ResolvedRouteUnion<TRouteFrom>,
}

export type BeforeLeaveHook<
  TRoutes extends Routes = Routes,
  TRejections extends Rejections = Rejections,
  TRouteTo extends Route = TRoutes[number],
  TRouteFrom extends Route = TRoutes[number]
> = (to: ResolvedRouteUnion<TRouteTo>, context: BeforeLeaveHookContext<TRoutes, TRejections, TRouteTo, TRouteFrom>) => MaybePromise<void>

export type AddBeforeLeaveHook<
  TRoutes extends Routes = Routes,
  TRejections extends Rejections = Rejections,
  TRouteTo extends Route = TRoutes[number],
  TRouteFrom extends Route = TRoutes[number]
> = (hook: BeforeLeaveHook<TRoutes, TRejections, TRouteTo, TRouteFrom>) => HookRemove

export type AfterEnterHookContext<
  TRoutes extends Routes = Routes,
  TRejections extends Rejections = Rejections,
  TRouteTo extends Route = TRoutes[number],
  TRouteFrom extends Route = TRoutes[number]
> = AfterHookContext<TRouteTo, TRoutes, TRejections> & {
  from: ResolvedRouteUnion<TRouteFrom> | null,
}

export type AfterEnterHook<
  TRoutes extends Routes = Routes,
  TRejections extends Rejections = Rejections,
  TRouteTo extends Route = TRoutes[number],
  TRouteFrom extends Route = TRoutes[number]
> = (to: ResolvedRouteUnion<TRouteTo>, context: AfterEnterHookContext<TRoutes, TRejections, TRouteTo, TRouteFrom>) => MaybePromise<void>

export type AddAfterEnterHook<
  TRoutes extends Routes = Routes,
  TRejections extends Rejections = Rejections,
  TRouteTo extends Route = TRoutes[number],
  TRouteFrom extends Route = TRoutes[number]
> = (hook: AfterEnterHook<TRoutes, TRejections, TRouteTo, TRouteFrom>) => HookRemove

export type AfterUpdateHookContext<
  TRoutes extends Routes = Routes,
  TRejections extends Rejections = Rejections,
  TRouteTo extends Route = TRoutes[number],
  TRouteFrom extends Route = TRoutes[number]
> = AfterHookContext<TRouteTo, TRoutes, TRejections> & {
  from: ResolvedRouteUnion<TRouteFrom> | null,
}

export type AfterUpdateHook<
  TRoutes extends Routes = Routes,
  TRejections extends Rejections = Rejections,
  TRouteTo extends Route = TRoutes[number],
  TRouteFrom extends Route = TRoutes[number]
> = (to: ResolvedRouteUnion<TRouteTo>, context: AfterUpdateHookContext<TRoutes, TRejections, TRouteTo, TRouteFrom>) => MaybePromise<void>

export type AddAfterUpdateHook<
  TRoutes extends Routes = Routes,
  TRejections extends Rejections = Rejections,
  TRouteTo extends Route = TRoutes[number],
  TRouteFrom extends Route = TRoutes[number]
> = (hook: AfterUpdateHook<TRoutes, TRejections, TRouteTo, TRouteFrom>) => HookRemove

export type AfterLeaveHookContext<
  TRoutes extends Routes = Routes,
  TRejections extends Rejections = Rejections,
  TRouteTo extends Route = TRoutes[number],
  TRouteFrom extends Route = TRoutes[number]
> = AfterHookContext<TRouteTo, TRoutes, TRejections> & {
  from: ResolvedRouteUnion<TRouteFrom>,
}

export type AfterLeaveHook<
  TRoutes extends Routes = Routes,
  TRejections extends Rejections = Rejections,
  TRouteTo extends Route = TRoutes[number],
  TRouteFrom extends Route = TRoutes[number]
> = (to: ResolvedRouteUnion<TRouteTo>, context: AfterLeaveHookContext<TRoutes, TRejections, TRouteTo, TRouteFrom>) => MaybePromise<void>

export type AddAfterLeaveHook<
  TRoutes extends Routes = Routes,
  TRejections extends Rejections = Rejections,
  TRouteTo extends Route = TRoutes[number],
  TRouteFrom extends Route = TRoutes[number]
> = (hook: AfterLeaveHook<TRoutes, TRejections, TRouteTo, TRouteFrom>) => HookRemove

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
