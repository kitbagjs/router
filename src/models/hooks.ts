import { AfterEnterHook, AfterLeaveHook, AfterUpdateHook, BeforeEnterHook, BeforeLeaveHook, BeforeUpdateHook, ErrorHook, TitleHook } from '@/types/hooks'
import { RedirectHook } from '@/types/redirects'

export class Hooks {
  public redirects = new Set<RedirectHook>()
  public onBeforeRouteEnter = new Set<BeforeEnterHook>()
  public onBeforeRouteUpdate = new Set<BeforeUpdateHook>()
  public onBeforeRouteLeave = new Set<BeforeLeaveHook>()
  public onAfterRouteEnter = new Set<AfterEnterHook>()
  public onAfterRouteUpdate = new Set<AfterUpdateHook>()
  public onAfterRouteLeave = new Set<AfterLeaveHook>()
  public setTitle = new Set<TitleHook>()
  public onError = new Set<ErrorHook>()
}
