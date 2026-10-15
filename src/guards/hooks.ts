import { Hook, isHook as isHookInternal } from '@/types/hook'
import { RouteContext } from '@/types/routeContext'

export function isHook(value: unknown): value is Hook<readonly RouteContext[]> {
  return isHookInternal(value)
}
