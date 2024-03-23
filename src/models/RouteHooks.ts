import { AfterRouteHook, BeforeRouteHook } from '@/types/hooks'

export class RouteHooks {
  public onBeforeRouteEnter = new Set<BeforeRouteHook>()
  public onBeforeRouteUpdate = new Set<BeforeRouteHook>()
  public onBeforeRouteLeave = new Set<BeforeRouteHook>()
  public onAfterRouteEnter = new Set<AfterRouteHook>()
  public onAfterRouteUpdate = new Set<AfterRouteHook>()
  public onAfterRouteLeave = new Set<AfterRouteHook>()
}