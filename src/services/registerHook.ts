import { HookRegistrationOptions, HookRemove } from '@/types/hooks'

export function registerHook<THook>(hooks: Set<THook>, hook: THook, { signal }: HookRegistrationOptions = {}): HookRemove {
  if (signal?.aborted) {
    return () => {}
  }

  hooks.add(hook)

  function remove(): void {
    hooks.delete(hook)
    signal?.removeEventListener('abort', remove)
  }

  signal?.addEventListener('abort', remove, { once: true })

  return remove
}
