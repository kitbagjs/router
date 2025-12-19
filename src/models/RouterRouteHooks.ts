import { RouterAfterRouteHook, RouterBeforeRouteHook, RouterErrorHook } from '@/types/hooks'

export class RouterRouteHooks {
  public onBeforeRouteEnter: Set<RouterBeforeRouteHook<any, any>>
  public onBeforeRouteUpdate: Set<RouterBeforeRouteHook<any, any>>
  public onBeforeRouteLeave: Set<RouterBeforeRouteHook<any, any>>
  public onAfterRouteEnter: Set<RouterAfterRouteHook<any, any>>
  public onAfterRouteUpdate: Set<RouterAfterRouteHook<any, any>>
  public onAfterRouteLeave: Set<RouterAfterRouteHook<any, any>>
  public onError: Set<RouterErrorHook<any, any>>

  public constructor(...stores: RouterRouteHooks[]) {
    this.onBeforeRouteEnter = new Set<RouterBeforeRouteHook>([...stores.flatMap((hooks) => [...hooks.onBeforeRouteEnter])])
    this.onBeforeRouteUpdate = new Set<RouterBeforeRouteHook>([...stores.flatMap((hooks) => [...hooks.onBeforeRouteUpdate])])
    this.onBeforeRouteLeave = new Set<RouterBeforeRouteHook>([...stores.flatMap((hooks) => [...hooks.onBeforeRouteLeave])])
    this.onAfterRouteEnter = new Set<RouterAfterRouteHook>([...stores.flatMap((hooks) => [...hooks.onAfterRouteEnter])])
    this.onAfterRouteUpdate = new Set<RouterAfterRouteHook>([...stores.flatMap((hooks) => [...hooks.onAfterRouteUpdate])])
    this.onAfterRouteLeave = new Set<RouterAfterRouteHook>([...stores.flatMap((hooks) => [...hooks.onAfterRouteLeave])])
    this.onError = new Set<RouterErrorHook>([...stores.flatMap((hooks) => [...hooks.onError])])
  }
}
