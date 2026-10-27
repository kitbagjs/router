import { AnyHook } from '@/types/hook'
import { HookEntry, ComponentHook, AfterEnterHook, AfterLeaveHook, AfterUpdateHook, BeforeEnterHook, BeforeLeaveHook, BeforeUpdateHook, ErrorHook, RejectionHook } from '@/types/hooks'
import { RedirectHook } from '@/types/redirects'

/**
 * Stores registrations or gathers them for an execution. Collected arrays retain
 * the same entries and their removal functions, which target the original arrays.
 */
export class Hooks {
  public onHookAdded = new Set<(hook: ComponentHook | AnyHook) => void>()
  public redirects: HookEntry<RedirectHook>[] = []
  public onBeforeRouteEnter: HookEntry<BeforeEnterHook | AnyHook>[] = []
  public onBeforeRouteUpdate: HookEntry<BeforeUpdateHook | AnyHook>[] = []
  public onBeforeRouteLeave: HookEntry<BeforeLeaveHook | AnyHook>[] = []
  public onAfterRouteEnter: HookEntry<AfterEnterHook | AnyHook>[] = []
  public onAfterRouteUpdate: HookEntry<AfterUpdateHook | AnyHook>[] = []
  public onAfterRouteLeave: HookEntry<AfterLeaveHook | AnyHook>[] = []
  public onError: HookEntry<ErrorHook>[] = []
  public onRejection: HookEntry<RejectionHook>[] = []
}
