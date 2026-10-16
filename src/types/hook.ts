import { RouteContext, RouteContextToRejection, RouteContextToRoute } from '@/types/routeContext'
import { ResolvedRoute, ResolvedRouteUnion } from '@/types/resolved'
import { Routes } from '@/types/route'
import { RouterPush } from '@/types/routerPush'
import { RouterReplace } from '@/types/routerReplace'
import { RouterReject } from '@/types/routerReject'
import { RouterAbort } from '@/types/routerAbort'
import { RouteUpdate } from '@/types/routeUpdate'
import { AnyFunction, MaybePromise } from '@/types/utilities'

export const IS_HOOK_SYMBOL = Symbol('IS_HOOK_SYMBOL')

export type HookInternal = {
  [IS_HOOK_SYMBOL]: true,
}

/**
 * Navigation helpers available to a reusable hook from its declared context.
 */
export type HookSharedContext<TContext extends readonly RouteContext[] = [], TRoutes extends Routes = Routes> = {
  from: ResolvedRouteUnion<TRoutes[number]> | null,
  push: RouterPush<RouteContextToRoute<[...TContext]>>,
  replace: RouterReplace<RouteContextToRoute<[...TContext]>>,
  reject: RouterReject<RouteContextToRejection<[...TContext]>>,
  update?: RouteUpdate,
  signal: AbortSignal,
}

/**
 * Context provided to a reusable hook, narrowed by whether it runs before or after navigation.
 */
export type HookCallbackContext<TContext extends readonly RouteContext[] = [], TRoutes extends Routes = Routes> = HookSharedContext<TContext, TRoutes> & (
  | { lifecycle: 'before', abort: RouterAbort }
  | { lifecycle: 'after' }
)

/**
 * Options for a reusable route hook.
 */
export type CreateHookOptions<TContext extends readonly RouteContext[] = [], TRoutes extends Routes = Routes> = {
  hook: (route: ResolvedRouteUnion<TRoutes[number]> | null, context: HookCallbackContext<TContext, TRoutes>) => MaybePromise<void>,
  /**
   * See [Context](https://kitbag-router.netlify.app/advanced-concepts/context).
   */
  context?: TContext,
}

/**
 * Creates hooks with callbacks typed to the router's resolved routes.
 */
export type CreateHook<TRoutes extends Routes = Routes> = <
  const TContext extends readonly RouteContext[] = []
>(options: CreateHookOptions<TContext, TRoutes>) => Hook<TContext>

/**
 * The arguments provided when invoking a reusable hook.
 */
export type HookInvocationContext = {
  from: ResolvedRoute | null,
  push: AnyFunction,
  replace: AnyFunction,
  reject: AnyFunction,
  update?: AnyFunction,
  signal: AbortSignal,
} & (
  | { lifecycle: 'before', abort: RouterAbort }
  | { lifecycle: 'after' }
)

/**
 * A reusable hook that can be attached before or after a route enters, updates, or leaves.
 */
export type Hook<TContext extends readonly RouteContext[] = []> = ((route: ResolvedRoute | null, context: HookInvocationContext) => MaybePromise<void>) & {
  context: TContext,
}

/**
 * Determines whether a value is a reusable hook.
 */
export function isHook(value: unknown): value is Hook<readonly RouteContext[]> & HookInternal {
  return typeof value === 'function' && IS_HOOK_SYMBOL in value
}
