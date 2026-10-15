import { RouteContext } from '@/types/routeContext'
import { CreateHookOptions, Hook, HookInvocationContext, HookSharedContext, IS_HOOK_SYMBOL } from '@/types/hook'
import { ResolvedRoute } from '@/types/resolved'
import { MaybePromise } from '@/types/utilities'

/**
 * Creates a reusable hook with navigation helpers from its declared context.
 */
export function createHook<const TContext extends readonly RouteContext[] = []>(options: CreateHookOptions<TContext>): Hook<TContext>

export function createHook(options: CreateHookOptions<any>): Hook<any> {
  const callback = options.hook

  function hook(route: ResolvedRoute | null, context: HookInvocationContext): MaybePromise<void> {
    const shared: HookSharedContext<any> = {
      from: context.from,
      push: context.push,
      replace: context.replace,
      reject: context.reject,
      signal: context.signal,
    }

    if (route && context.update) {
      shared.update = context.update
    }

    if (context.abort) {
      return callback(route, { ...shared, kind: 'before', abort: context.abort })
    }

    return callback(route, { ...shared, kind: 'after' })
  }

  hook.context = [...options.context ?? []]
  hook[IS_HOOK_SYMBOL] = true

  return hook
}
