import { AnyHook, isHook } from '@/types/hook'
import { AnyFunction } from '@/types/utilities'

export function toHook(hook: AnyFunction | AnyHook): AnyHook['hook'] {
  if (typeof hook === 'function') {
    return hook
  }

  if (!isHook(hook)) {
    throw new TypeError('Expected a hook created by createHook')
  }

  return hook.hook
}
