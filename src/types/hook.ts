import { RouteContext, RouteContextToRejection, RouteContextToRoute } from '@/types/routeContext'
import { ResolvedRouteUnion } from '@/types/resolved'
import { Route, Routes } from '@/types/route'
import { BeforeHookContext, AfterHookContext } from '@/types/hooks'
import { RouteUpdate } from '@/types/routeUpdate'
import { AnyFunction, MaybePromise } from '@/types/utilities'

export const IS_HOOK_SYMBOL = Symbol('IS_HOOK_SYMBOL')

export type HookInternal = {
  [IS_HOOK_SYMBOL]: true,
}

/**
 * Context provided to a reusable hook, narrowed by whether it runs before or after navigation.
 */
export type HookCallbackContext<TContext extends readonly RouteContext[] = [], TRoutes extends Routes = Routes> = {
  from: ResolvedRouteUnion<TRoutes[number]> | null,
  update?: RouteUpdate,
} & (
  | Omit<BeforeHookContext<Route, RouteContextToRoute<[...TContext]>, RouteContextToRejection<[...TContext]>>, 'update'>
  | Omit<AfterHookContext<Route, RouteContextToRoute<[...TContext]>, RouteContextToRejection<[...TContext]>>, 'update'>
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
 * A reusable hook that can be attached before or after a route enters, updates, or leaves.
 */
export type Hook<TContext extends readonly RouteContext[] = []> = {
  hook: AnyFunction<MaybePromise<void>>,
  context: TContext,
}

export type AnyHook = Hook<readonly RouteContext[]>

/**
 * Determines whether a value is a reusable hook.
 */
export function isHook(value: unknown): value is AnyHook & HookInternal {
  return typeof value === 'object' && value !== null && IS_HOOK_SYMBOL in value
}
