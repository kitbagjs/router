import { Hooks } from '@/models/hooks'
import { HookRegistrationOptions, HookRemove, HookStoreKey, HookTypes } from '@/types/hooks'

export function registerHook<TLifecycle extends HookStoreKey>(store: Hooks, hook: HookTypes[TLifecycle], lifecycle: TLifecycle, options: HookRegistrationOptions = {}): HookRemove {
  if (options.signal?.aborted) {
    return () => {}
  }

  const existing = store.get(lifecycle).find((entry) => entry.hook === hook)

  if (existing) {
    return existing.remove
  }

  return store.add(hook, lifecycle, options).remove
}
