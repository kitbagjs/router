import { AnyHook } from '@/types/hook'
import { ComponentHook, AfterEnterHook, AfterLeaveHook, AfterUpdateHook, BeforeEnterHook, BeforeLeaveHook, BeforeUpdateHook, ErrorHook, RejectionHook } from '@/types/hooks'
import { RedirectHook } from '@/types/redirects'

export class Hooks {
  public onHookAdded = new Set<(hook: ComponentHook | AnyHook) => void>()
  public redirects = new Set<RedirectHook>()
  public onBeforeRouteEnter = new Set<BeforeEnterHook | AnyHook>()
  public onBeforeRouteUpdate = new Set<BeforeUpdateHook | AnyHook>()
  public onBeforeRouteLeave = new Set<BeforeLeaveHook | AnyHook>()
  public onAfterRouteEnter = new Set<AfterEnterHook | AnyHook>()
  public onAfterRouteUpdate = new Set<AfterUpdateHook | AnyHook>()
  public onAfterRouteLeave = new Set<AfterLeaveHook | AnyHook>()
  public onError = new Set<ErrorHook>()
  public onRejection = new Set<RejectionHook>()
}
