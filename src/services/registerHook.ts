import { AnyHook } from '@/types/hook'
import { HookCallback, HookEntry, HookRegistrationOptions, HookRemove } from '@/types/hooks'

export function registerHook(hooks: HookEntry<HookCallback | AnyHook>[], hook: HookCallback | AnyHook, { signal }: HookRegistrationOptions = {}): HookRemove {
  if (signal?.aborted) {
    return () => {}
  }

  const entry = { hook, remove }

  function remove(): void {
    const index = hooks.indexOf(entry)

    if (index !== -1) {
      hooks.splice(index, 1)
    }

    signal?.removeEventListener('abort', remove)
  }

  hooks.push(entry)
  signal?.addEventListener('abort', remove, { once: true })

  return remove
}
