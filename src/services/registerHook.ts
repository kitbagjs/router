import { AnyHook, isHook } from '@/types/hook'
import { HookRegistrationOptions, HookRemove } from '@/types/hooks'
import { AnyFunction, MaybePromise } from '@/types/utilities'
import { toHook } from '@/services/toHook'

/**
 * Registers a distinct wrapper so removal targets only this registration.
 * Reusable definitions keep their marker and declared context.
 */
export function registerHook(
  hooks: (AnyFunction<MaybePromise<void>> | AnyHook)[],
  hook: AnyFunction<MaybePromise<void>> | AnyHook,
  { signal }: HookRegistrationOptions = {},
): HookRemove {
  if (signal?.aborted) {
    return () => {}
  }

  const callback = toHook(hook)
  const wrapped = (value: unknown, context: object): MaybePromise<void> => callback(value, context)
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
