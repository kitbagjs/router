import { AnyHook, isHook } from '@/types/hook'
import { HookCallback } from '@/types/hooks'
import { AnyFunction, MaybePromise } from '@/types/utilities'

export function toHook(hook: HookCallback | AnyHook): AnyFunction<MaybePromise<void>> {
  if (typeof hook === 'function') {
    return hook
  }

  if (!isHook(hook)) {
    throw new TypeError('Expected a hook created by createHook')
  }

  return hook.hook
}
