import { RouteContext } from '@/types/routeContext'
import { CreateHookOptions, Hook, HookInvocationContext, IS_HOOK_SYMBOL } from '@/types/hook'
import { ResolvedRoute } from '@/types/resolved'
import { MaybePromise } from '@/types/utilities'

/**
 * Creates a reusable hook with navigation helpers from its declared context.
 */
export function createHook<const TContext extends readonly RouteContext[] = []>(options: CreateHookOptions<TContext>): Hook<TContext>

export function createHook(options: CreateHookOptions<any>): Hook<any> {
  const callback = options.hook

  function hook(route: ResolvedRoute, context: HookInvocationContext): MaybePromise<void> {
    return callback(route, context)
  }

  hook.context = [...options.context ?? []]
  hook[IS_HOOK_SYMBOL] = true

  return hook
}
