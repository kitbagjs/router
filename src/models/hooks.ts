import { ComponentHook, AfterEnterHook, AfterLeaveHook, AfterUpdateHook, BeforeEnterHook, BeforeLeaveHook, BeforeUpdateHook, ErrorHook, RejectionHook } from '@/types/hooks'
import { RouteContext } from '@/types/routeContext'
import { RedirectHook } from '@/types/redirects'

export class Hooks {
  public context: RouteContext[] = []
  public onHookAdded = new Set<(hook: ComponentHook) => void>()
  public redirects = new Set<RedirectHook>()
  public onBeforeRouteEnter = new Set<BeforeEnterHook>()
  public onBeforeRouteUpdate = new Set<BeforeUpdateHook>()
  public onBeforeRouteLeave = new Set<BeforeLeaveHook>()
  public onAfterRouteEnter = new Set<AfterEnterHook>()
  public onAfterRouteUpdate = new Set<AfterUpdateHook>()
  public onAfterRouteLeave = new Set<AfterLeaveHook>()
  public onError = new Set<ErrorHook>()
  public onRejection = new Set<RejectionHook>()
}
