import { AnyHook } from '@/types/hook'
import { AfterEnterHook, AfterLeaveHook, AfterUpdateHook, BeforeEnterHook, BeforeLeaveHook, BeforeUpdateHook, ErrorHook, RejectionHook } from '@/types/hooks'
import { RedirectHook } from '@/types/redirects'

export class CollectedHooks {
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
