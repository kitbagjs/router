import { ResolvedRoute } from '@/types/resolved'
import { MaybePromise } from '@/types/utilities'
import { Hooks } from '@/models/hooks'
import { ComponentHook, HookEntry, HookLifecycle, BEFORE_LEAVE_HOOKS, BeforeLeaveHookState } from '@/types/hooks'
import { AnyHook } from '@/types/hook'
import { getRouteHookCondition, claimLeaveHook } from '@/services/hooks'
import { toHookCallback } from '@/services/toHookCallback'

/**
 * Collects the current registrations without losing their lifecycle scope or removal functions.
 */
export function createResolvedHooks(stores: Hooks[]): Hooks {
  const hooks = new Hooks()

  function collect<THook extends ComponentHook>(entries: HookEntry<THook | AnyHook>[], lifecycle: HookLifecycle, depth: number): HookEntry<THook>[] {
    const condition = getRouteHookCondition(lifecycle)

    return entries.map(({ hook, remove }) => {
      const scoped = (to: ResolvedRoute | null, context: Parameters<ComponentHook>[1] & BeforeLeaveHookState): MaybePromise<void> => {
        if (!condition(to, context.from, depth)) {
          return
        }

        if (lifecycle === 'onBeforeRouteLeave' && !claimLeaveHook(remove, context[BEFORE_LEAVE_HOOKS])) {
          return
        }

        // The lifecycle condition narrows the destination and origin for this registration.
        const callback = toHookCallback(hook) as typeof scoped
        return callback(to, context)
      }

      return { hook: scoped as THook, remove }
    })
  }

  for (const [depth, store] of stores.entries()) {
    hooks.onBeforeRouteEnter.push(...collect(store.onBeforeRouteEnter, 'onBeforeRouteEnter', depth))
    hooks.onBeforeRouteUpdate.push(...collect(store.onBeforeRouteUpdate, 'onBeforeRouteUpdate', depth))
    hooks.onBeforeRouteLeave.push(...collect(store.onBeforeRouteLeave, 'onBeforeRouteLeave', depth))
    hooks.onAfterRouteEnter.push(...collect(store.onAfterRouteEnter, 'onAfterRouteEnter', depth))
    hooks.onAfterRouteUpdate.push(...collect(store.onAfterRouteUpdate, 'onAfterRouteUpdate', depth))
    hooks.onAfterRouteLeave.push(...collect(store.onAfterRouteLeave, 'onAfterRouteLeave', depth))
    hooks.onError.push(...store.onError)
    hooks.onRejection.push(...store.onRejection)

    if (depth === stores.length - 1) {
      hooks.redirects.push(...store.redirects)
    }
  }

  return hooks
}
