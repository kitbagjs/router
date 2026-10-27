import { AnyHook, isHook } from '@/types/hook'
import { HookCallback } from '@/types/hooks'

export function toHook(hook: HookCallback | AnyHook): AnyHook['hook'] {
  if (typeof hook === 'function') {
    return hook
  }

  if (!isHook(hook)) {
    throw new TypeError('Expected a hook created by createHook')
  }

  return hook.hook
}
