import { AnyHook } from '@/types/hook'
import { ComponentHook, AfterEnterHook, AfterLeaveHook, AfterUpdateHook, BeforeEnterHook, BeforeLeaveHook, BeforeUpdateHook, ErrorHook, RejectionHook } from '@/types/hooks'
import { RedirectHook } from '@/types/redirects'

/**
 * Stores registered hooks or gathers them for an execution. Collected arrays retain
 * the same wrapper references, whose removal functions belong to their source arrays.
 */
export class Hooks {
  public onHookAdded = new Set<(hook: ComponentHook | AnyHook) => void>()
  public redirects: RedirectHook[] = []
  public onBeforeRouteEnter: (BeforeEnterHook | AnyHook)[] = []
  public onBeforeRouteUpdate: (BeforeUpdateHook | AnyHook)[] = []
  public onBeforeRouteLeave: (BeforeLeaveHook | AnyHook)[] = []
  public onAfterRouteEnter: (AfterEnterHook | AnyHook)[] = []
  public onAfterRouteUpdate: (AfterUpdateHook | AnyHook)[] = []
  public onAfterRouteLeave: (AfterLeaveHook | AnyHook)[] = []
  public onError: ErrorHook[] = []
  public onRejection: RejectionHook[] = []
}
