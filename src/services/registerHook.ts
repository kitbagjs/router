import { AnyHook, isHook } from '@/types/hook'
import { HookRegistrationOptions, HookRemove } from '@/types/hooks'
import { MaybePromise } from '@/types/utilities'
import { toHook } from '@/services/toHook'

export function registerHook<TValue, TContext extends object>(hooks: (((value: TValue, context: TContext) => MaybePromise<void>) | AnyHook)[], hook: ((value: TValue, context: TContext) => MaybePromise<void>) | AnyHook, { signal }: HookRegistrationOptions = {}): HookRemove {
  if (signal?.aborted) {
    return () => {}
  }

  const callback = toHook(hook)
  const wrapped = (value: TValue, context: TContext): MaybePromise<void> => callback(value, context)
  const registered = isHook(hook) ? { ...hook, hook: wrapped } : wrapped

  function remove(): void {
    const index = hooks.indexOf(registered)

    if (index !== -1) {
      hooks.splice(index, 1)
    }

    signal?.removeEventListener('abort', remove)
  }

  hooks.push(registered)
  signal?.addEventListener('abort', remove, { once: true })

  return remove
}
