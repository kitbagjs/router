import { AfterHook, BeforeHook, ErrorHook } from '@/types/hooks'

export class Hooks {
  public onBeforeRouteEnter = new Set<BeforeHook>()
  public onBeforeRouteUpdate = new Set<BeforeHook>()
  public onBeforeRouteLeave = new Set<BeforeHook>()
  public onAfterRouteEnter = new Set<AfterHook>()
  public onAfterRouteUpdate = new Set<AfterHook>()
  public onAfterRouteLeave = new Set<AfterHook>()
  public onError = new Set<ErrorHook>()
}
