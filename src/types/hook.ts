import { RouteContext, RouteContextToRejection, RouteContextToRoute } from '@/types/routeContext'
import { Register } from '@/types/register'
import { ResolvedRoute, RouterResolvedRouteUnion } from '@/types/resolved'
import { Router, RouterRoutes } from '@/types/router'
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
 * The resolved routes available to a reusable hook.
 */
export type HookRoute<TRegister = Register> = TRegister extends { router: infer TRouter extends Router }
  ? RouterResolvedRouteUnion<RouterRoutes<TRouter>>
  : ResolvedRoute

/**
 * Navigation helpers available to a reusable hook from its declared context.
 */
export type HookSharedContext<TContext extends readonly RouteContext[] = []> = {
  from: HookRoute | null,
  push: RouterPush<RouteContextToRoute<[...TContext]>>,
  replace: RouterReplace<RouteContextToRoute<[...TContext]>>,
  reject: RouterReject<RouteContextToRejection<[...TContext]>>,
  update?: RouteUpdate,
  signal: AbortSignal,
}

/**
 * Context provided to a reusable hook, narrowed by whether it runs before or after navigation.
 */
export type HookCallbackContext<TContext extends readonly RouteContext[] = []> = HookSharedContext<TContext> & (
  | { kind: 'before', abort: RouterAbort }
  | { kind: 'after' }
)

/**
 * Options for a reusable route hook.
 */
export type CreateHookOptions<TContext extends readonly RouteContext[] = []> = {
  hook: (route: HookRoute | null, context: HookCallbackContext<TContext>) => MaybePromise<void>,
  context?: TContext,
}

/**
 * The arguments provided when invoking a reusable hook.
 */
export type HookInvocationContext = {
  from: ResolvedRoute | null,
  push: AnyFunction,
  replace: AnyFunction,
  reject: AnyFunction,
  update?: AnyFunction,
  abort?: RouterAbort,
  signal: AbortSignal,
}

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
