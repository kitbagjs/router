import { CallbackAbortResponse, CallbackPushResponse, CallbackRejectResponse, CallbackSuccessResponse } from '@/services/createCallbackContext'
import { RegisteredRouterPush, RegisteredRouterReplace } from '@/types/register'
import { ResolvedRoute } from '@/types/resolved'
import { RouterReject } from '@/types/router'
import { MaybePromise } from '@/types/utilities'

/**
 * Adds a hook that is called before a route change. Returns a function to remove the hook.
 * @param hook - {@link BeforeRouteHook} The hook function to add.
 * @returns {RouteHookRemove} A function that removes the added hook.
 */
export type AddBeforeRouteHook = (hook: BeforeRouteHook) => RouteHookRemove

/**
 * Adds a hook that is called after a route change. Returns a function to remove the hook.
 * @param hook - {@link AfterRouteHook} The hook function to add.
 * @returns {RouteHookRemove} A function that removes the added hook.
 */
export type AddAfterRouteHook = (hook: AfterRouteHook) => RouteHookRemove

/**
 * A function that can be called to abort a routing operation.
 */
export type RouteHookAbort = () => void

/**
 * Context provided to route hooks, containing context of previous route and functions for triggering rejections and push/replace to another route.
 */
type RouteHookContext = {
  from: ResolvedRoute | null,
  reject: RouterReject,
  push: RegisteredRouterPush,
  replace: RegisteredRouterReplace,
}

/**
 * Context provided to route hooks, containing context of previous route and functions for triggering rejections, push/replace to another route,
 * as well as aborting current route change.
 */
type BeforeRouteHookContext = RouteHookContext & {
  abort: RouteHookAbort,
}

/**
 * Context provided to route hooks, containing context of previous route and functions for triggering rejections and push/replace to another route.
 */
type AfterRouteHookContext = RouteHookContext

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
