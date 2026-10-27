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

  const { signal } = options
  const entry = { lifecycle, hook, remove }

  function remove(): void {
    store.delete(entry)
    signal?.removeEventListener('abort', remove)
  }

  store.add(entry)
  signal?.addEventListener('abort', remove, { once: true })

  return remove
}
