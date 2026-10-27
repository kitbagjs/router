import { Hooks } from '@/models/hooks'
import { AnyHook } from '@/types/hook'
import { AfterEnterHook, AfterLeaveHook, AfterUpdateHook, BeforeEnterHook, BeforeLeaveHook, BeforeUpdateHook, ErrorHook, RejectionHook } from '@/types/hooks'
import { RedirectHook } from '@/types/redirects'

export type HookStoreKey = Exclude<keyof Hooks, 'onHookAdded'>

/**
 * The source of truth for hooks selected from multiple hook stores for an execution.
 * Built at runtime, preserving separate registrations and their order. The original
 * stores continue to own registration and removal.
 */
export type HooksCollection = {
  redirects: RedirectHook[],
  onBeforeRouteEnter: (BeforeEnterHook | AnyHook)[],
  onBeforeRouteUpdate: (BeforeUpdateHook | AnyHook)[],
  onBeforeRouteLeave: (BeforeLeaveHook | AnyHook)[],
  onAfterRouteEnter: (AfterEnterHook | AnyHook)[],
  onAfterRouteUpdate: (AfterUpdateHook | AnyHook)[],
  onAfterRouteLeave: (AfterLeaveHook | AnyHook)[],
  onError: ErrorHook[],
  onRejection: RejectionHook[],
  /**
   * Appends one store's registrations for the selected hook kind in insertion order.
   */
  add: (store: Hooks, lifecycle: HookStoreKey) => void,
}
