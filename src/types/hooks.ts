import { RouterRouteHooks } from '@/models/RouterRouteHooks'
import { CallbackAbortResponse, CallbackContext, CallbackContextAbort, CallbackPushResponse, CallbackRejectResponse, CallbackSuccessResponse } from '@/services/createCallbackContext'
import { ResolvedRoute, RouterResolvedRouteUnion } from '@/types/resolved'
import { MaybeArray, MaybePromise } from '@/types/utilities'
import { Routes } from './route'
import { RouterReject } from './routerReject'
import { RouterPush } from './routerPush'
import { RouterReplace } from './routerReplace'
import { Rejection } from './rejection'

/**
 * Defines route hooks that can be applied before entering, updating, or leaving a route, as well as after these events.
 */
export type WithHooks = {
  /**
   * @deprecated Use router.onBeforeRouteEnter instead
   */
  onBeforeRouteEnter?: MaybeArray<BeforeRouteHook>,
  /**
   * @deprecated Use router.onBeforeRouteUpdate instead
   */
  onBeforeRouteUpdate?: MaybeArray<BeforeRouteHook>,
  /**
   * @deprecated Use router.onBeforeRouteLeave instead
   */
  onBeforeRouteLeave?: MaybeArray<BeforeRouteHook>,
  /**
   * @deprecated Use router.onAfterRouteEnter instead
   */
  onAfterRouteEnter?: MaybeArray<AfterRouteHook>,
  /**
   * @deprecated Use router.onAfterRouteUpdate instead
   */
  onAfterRouteUpdate?: MaybeArray<AfterRouteHook>,
  /**
   * @deprecated Use router.onAfterRouteLeave instead
   */
  onAfterRouteLeave?: MaybeArray<AfterRouteHook>,
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
 * Context provided to route hooks, containing context of previous route and functions for triggering rejections and push/replace to another route.
 */
type RouteHookContext = {
  from: ResolvedRoute | null,
  reject: CallbackContext['reject'],
  push: CallbackContext['push'],
  replace: CallbackContext['replace'],
}

/**
 * Context provided to route hooks, containing context of previous route and functions for triggering rejections, push/replace to another route,
 * as well as aborting current route change.
 */
export type BeforeRouteHookContext = RouteHookContext & {
  abort: CallbackContextAbort,
}

/**
 * Context provided to route hooks, containing context of previous route and functions for triggering rejections and push/replace to another route.
 */
export type AfterRouteHookContext = RouteHookContext

/**
 * Represents a function called before a route change, potentially altering the routing operation.
 * @param to - {@link ResolvedRoute} The resolved route the router is navigating to.
 * @param context - {@link BeforeRouteHookContext} The context providing functions and state for the routing operation.
 * @returns Possibly a promise that resolves when the hook's logic has completed.
 */
export type BeforeRouteHook = (to: ResolvedRoute, context: BeforeRouteHookContext) => MaybePromise<void>

/**
 * Represents a function called after a route change has occurred.
 * @param to - {@link ResolvedRoute} The resolved route the router has navigated to.
 * @param context - {@link AfterRouteHookContext} The context providing functions and state for the routing operation.
 * @returns Possibly a promise that resolves when the hook's logic has completed.
 */
export type AfterRouteHook = (to: ResolvedRoute, context: AfterRouteHookContext) => MaybePromise<void>

/**
 * Generic type representing a route hook, which can be either before or after a route change.
 */
export type RouteHook = BeforeRouteHook | AfterRouteHook

/**
 * A function to remove a previously registered route hook.
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

/**
 * Type for responses from a before route hook, which may indicate different outcomes such as success, push, reject, or abort.
 * @template TRoutes - The type of the routes configuration.
 */
export type BeforeRouteHookResponse = CallbackSuccessResponse | CallbackPushResponse | CallbackRejectResponse | CallbackAbortResponse

/**
 * Type for responses from an after route hook, which may indicate different outcomes such as success, push, or reject.
 * @template TRoutes - The type of the routes configuration.
 */
export type AfterRouteHookResponse = CallbackSuccessResponse | CallbackPushResponse | CallbackRejectResponse

/**
 * Union type for all possible route hook responses, covering both before and after scenarios.
 * @template TRoutes - The type of the routes configuration.
 */
export type RouteHookResponse = BeforeRouteHookResponse | AfterRouteHookResponse

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
  abort: CallbackContextAbort,
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
