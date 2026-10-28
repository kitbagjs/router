import { AnyHook, isHook } from '@/types/hook'
import { HookCallback } from '@/types/hooks'

export function toHookCallback<THook extends HookCallback>(hook: THook | AnyHook): THook
export function toHookCallback(hook: HookCallback | AnyHook): HookCallback {
  if (typeof hook === 'function') {
    return hook
  }

  if (!isHook(hook)) {
    throw new TypeError('Expected a hook created by createHook')
  }

  return hook.hook
}
