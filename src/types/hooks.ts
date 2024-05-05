import { RouterRejectionType } from '@/services/createRouterReject'
import { RegisteredRouterPush, RegisteredRouterReplace } from '@/types/register'
import { ResolvedRoute } from '@/types/resolved'
import { Routes } from '@/types/route'
import { RouterReject } from '@/types/router'
import { RouterPush } from '@/types/routerPush'
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
export type BeforeRouteHookLifecycle = 'onBeforeRouteEnter' | 'onBeforeRouteUpdate' |'onBeforeRouteLeave'

/**
 * Enumerates the lifecycle events for after route hooks.
 */
export type AfterRouteHookLifecycle = 'onAfterRouteEnter' | 'onAfterRouteUpdate' | 'onAfterRouteLeave'

/**
 * Union type for all route hook lifecycle events.
 */
export type RouteHookLifecycle = BeforeRouteHookLifecycle | AfterRouteHookLifecycle

/**
 * Defines the structure of a successful route hook response.
 */
type RouteHookSuccessResponse = {
  status: 'SUCCESS',
}

/**
 * Defines the structure of an aborted route hook response.
 */
type RouteHookAbortResponse = {
  status: 'ABORT',
}

/**
 * Defines the structure of a route hook response that results in a push to a new route.
 * @template T - The type of the routes configuration.
 */
type RouteHookPushResponse<T extends Routes> = {
  status: 'PUSH',
  to: Parameters<RouterPush<T>>,
}

/**
 * Defines the structure of a route hook response that results in the rejection of a route transition.
 */
type RouteHookRejectResponse = {
  status: 'REJECT',
  type: RouterRejectionType,
}

/**
 * Type for responses from a before route hook, which may indicate different outcomes such as success, push, reject, or abort.
 * @template TRoutes - The type of the routes configuration.
 */
export type BeforeRouteHookResponse<TRoutes extends Routes> = RouteHookSuccessResponse | RouteHookPushResponse<TRoutes> | RouteHookRejectResponse | RouteHookAbortResponse

/**
 * Type for responses from an after route hook, which may indicate different outcomes such as success, push, or reject.
 * @template TRoutes - The type of the routes configuration.
 */
export type AfterRouteHookResponse<TRoutes extends Routes> = RouteHookSuccessResponse | RouteHookPushResponse<TRoutes> | RouteHookRejectResponse

/**
 * Union type for all possible route hook responses, covering both before and after scenarios.
 * @template TRoutes - The type of the routes configuration.
 */
export type RouteHookResponse<TRoutes extends Routes> = BeforeRouteHookResponse<TRoutes> | AfterRouteHookResponse<TRoutes>
