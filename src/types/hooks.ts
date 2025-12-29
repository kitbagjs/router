import { Hooks } from '@/models/hooks'
import { RouterResolvedRouteUnion } from '@/types/resolved'
import { MaybePromise } from '@/types/utilities'
import { Routes } from './route'
import { RouterReject } from './routerReject'
import { RouterPush } from './routerPush'
import { RouterReplace } from './routerReplace'
import { Rejections } from './rejection'
import { RouteContext, RouteContextToRejection, RouteContextToRoute } from './routeContext'
import { RouterAbort } from './routerAbort'
import { CallbackContextAbort, CallbackContextPush, CallbackContextReject, CallbackContextSuccess } from './callbackContext'

export type InternalRouteHooks<TContext extends RouteContext[] | undefined = undefined> = {
  /**
   * Registers a route hook to be called before the route is entered.
   */
  onBeforeRouteEnter: AddBeforeHook<RouteContextToRoute<TContext>, RouteContextToRejection<TContext>>,
  /**
   * Registers a route hook to be called before the route is left.
   */
  onBeforeRouteLeave: AddBeforeHook<RouteContextToRoute<TContext>, RouteContextToRejection<TContext>>,
  /**
   * Registers a route hook to be called before the route is updated.
   */
  onBeforeRouteUpdate: AddBeforeHook<RouteContextToRoute<TContext>, RouteContextToRejection<TContext>>,
  /**
   * Registers a route hook to be called after the route is entered.
   */
  onAfterRouteEnter: AddAfterHook<RouteContextToRoute<TContext>, RouteContextToRejection<TContext>>,
  /**
   * Registers a route hook to be called after the route is left.
   */
  onAfterRouteLeave: AddAfterHook<RouteContextToRoute<TContext>, RouteContextToRejection<TContext>>,
  /**
   * Registers a route hook to be called after the route is updated.
   */
  onAfterRouteUpdate: AddAfterHook<RouteContextToRoute<TContext>, RouteContextToRejection<TContext>>,
  /**
    * Registers a hook to be called when an error occurs.
    * If the hook returns true, the error is considered handled and the other hooks are not run. If all hooks return false the error is rethrown
    */
  onError: AddErrorHook<RouteContextToRoute<TContext>, RouteContextToRejection<TContext>>,
}

export type ExternalRouteHooks<TContext extends RouteContext[] | undefined = undefined> = {
  /**
   * Registers a route hook to be called before the route is entered.
   */
  onBeforeRouteEnter: AddBeforeHook<RouteContextToRoute<TContext>, RouteContextToRejection<TContext>>,
  /**
    * Registers a hook to be called when an error occurs.
    * If the hook returns true, the error is considered handled and the other hooks are not run. If all hooks return false the error is rethrown
    */
  onError: AddErrorHook<RouteContextToRoute<TContext>, RouteContextToRejection<TContext>>,
}

export type HookTiming = 'global' | 'component'

type BeforeHookRegistration<
  TRoutes extends Routes,
  TRejections extends Rejections
> = {
  lifecycle: 'onBeforeRouteEnter' | 'onBeforeRouteUpdate' | 'onBeforeRouteLeave',
  hook: BeforeHook<TRoutes, TRejections>,
  depth: number,
}

export type AddComponentBeforeHook<
  TRoutes extends Routes = Routes,
  TRejections extends Rejections = Rejections
> = (hook: BeforeHookRegistration<TRoutes, TRejections>) => HookRemove

type AfterHookRegistration<
  TRoutes extends Routes = Routes,
  TRejections extends Rejections = Rejections
> = {
  lifecycle: 'onAfterRouteEnter' | 'onAfterRouteUpdate' | 'onAfterRouteLeave',
  hook: AfterHook<TRoutes, TRejections>,
  depth: number,
}

export type AddComponentAfterHook<
  TRoutes extends Routes = Routes,
  TRejections extends Rejections = Rejections
> = (hook: AfterHookRegistration<TRoutes, TRejections>) => HookRemove

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

type HookContext<
  TRoutes extends Routes,
  TRejections extends Rejections
> = {
  from: RouterResolvedRouteUnion<TRoutes> | null,
  reject: RouterReject<TRejections>,
  push: RouterPush<TRoutes>,
  replace: RouterReplace<TRoutes>,
}

type BeforeHookContext<
  TRoutes extends Routes,
  TRejections extends Rejections
> = HookContext<TRoutes, TRejections> & {
  abort: RouterAbort,
}

export type BeforeHook<
  TRoutes extends Routes = Routes,
  TRejections extends Rejections = Rejections
> = (to: RouterResolvedRouteUnion<TRoutes>, context: BeforeHookContext<TRoutes, TRejections>) => MaybePromise<void>

export type AddBeforeHook<
  TRoutes extends Routes = Routes,
  TRejections extends Rejections = Rejections
> = (hook: BeforeHook<TRoutes, TRejections>) => HookRemove

type AfterHookContext<
  TRoutes extends Routes = Routes,
  TRejections extends Rejections = Rejections
> = HookContext<TRoutes, TRejections>

export type AfterHook<
  TRoutes extends Routes = Routes,
  TRejections extends Rejections = Rejections
> = (to: RouterResolvedRouteUnion<TRoutes>, context: AfterHookContext<TRoutes, TRejections>) => MaybePromise<void>

export type AddAfterHook<
  TRoutes extends Routes = Routes,
  TRejections extends Rejections = Rejections
> = (hook: AfterHook<TRoutes, TRejections>) => HookRemove

export type BeforeHookResponse = CallbackContextSuccess | CallbackContextPush | CallbackContextReject | CallbackContextAbort
export type AfterHookResponse = CallbackContextSuccess | CallbackContextPush | CallbackContextReject

export type BeforeHookRunner = <TRoutes extends Routes>(context: { to: RouterResolvedRouteUnion<TRoutes>, from: RouterResolvedRouteUnion<TRoutes> | null }) => Promise<BeforeHookResponse>
export type AfterHookRunner = <TRoutes extends Routes>(context: { to: RouterResolvedRouteUnion<TRoutes>, from: RouterResolvedRouteUnion<TRoutes> | null }) => Promise<AfterHookResponse>

export type ErrorHookContext<
  TRoutes extends Routes = Routes,
  TRejections extends Rejections = Rejections
> = {
  to: RouterResolvedRouteUnion<TRoutes>,
  from: RouterResolvedRouteUnion<TRoutes> | null,
  source: 'props' | 'hook' | 'component',
  reject: RouterReject<TRejections>,
  push: RouterPush<TRoutes>,
  replace: RouterReplace<TRoutes>,
}

export type ErrorHook<
  TRoutes extends Routes = Routes,
  TRejections extends Rejections = Rejections
> = (error: unknown, context: ErrorHookContext<TRoutes, TRejections>) => void

export type AddErrorHook<
  TRoutes extends Routes = Routes,
  TRejections extends Rejections = Rejections
> = (hook: ErrorHook<TRoutes, TRejections>) => HookRemove

export type ErrorHookRunnerContext<TRoutes extends Routes = Routes> = {
  to: RouterResolvedRouteUnion<TRoutes>,
  from: RouterResolvedRouteUnion<TRoutes> | null,
  source: 'props' | 'hook',
}

export type ErrorHookRunner = (error: unknown, context: ErrorHookRunnerContext) => void
