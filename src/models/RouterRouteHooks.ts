import { RouterAfterRouteHook, RouterBeforeRouteHook, RouterErrorHook } from '@/types/hooks'

export class RouterRouteHooks {
  public onBeforeRouteEnter = new Set<RouterBeforeRouteHook>()
  public onBeforeRouteUpdate = new Set<RouterBeforeRouteHook>()
  public onBeforeRouteLeave = new Set<RouterBeforeRouteHook>()
  public onAfterRouteEnter = new Set<RouterAfterRouteHook>()
  public onAfterRouteUpdate = new Set<RouterAfterRouteHook>()
  public onAfterRouteLeave = new Set<RouterAfterRouteHook>()
  public onError = new Set<RouterErrorHook>()
}
