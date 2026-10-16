import { RouteContext } from '@/types/routeContext'
import { CreateHookOptions, Hook, HookInvocationContext, HookInternal, IS_HOOK_SYMBOL } from '@/types/hook'
import { ResolvedRoute } from '@/types/resolved'
import { Routes } from '@/types/route'
import { MaybePromise } from '@/types/utilities'

/**
 * Creates a reusable hook with navigation helpers from its declared context.
 */
export function createHook<
  const TContext extends readonly RouteContext[] = [],
  TRoutes extends Routes = Routes
>(options: CreateHookOptions<TContext, TRoutes>): Hook<TContext>

export function createHook(options: CreateHookOptions<any>): Hook<any> {
  const callback = options.hook

  function hook(route: ResolvedRoute | null, context: HookInvocationContext): MaybePromise<void> {
    if (!route) {
      return callback(route, { ...context, update: undefined })
    }

    return callback(route, context)
  }

  const context = [...options.context ?? []]
  const internal = {
    [IS_HOOK_SYMBOL]: true,
  } satisfies HookInternal

  return { ...options, ...internal, hook, context }
}
