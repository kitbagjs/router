import { RouteHooks } from '@/models/RouteHooks'
import { AfterRouteHook, BeforeRouteHook, RouteHookRemove } from '@/types/hooks'
import { getRouteHookCondition } from '@/utilities/hooks'

type RouteHookTiming = 'global' | 'component'

type BeforeRouteHookRegistration = {
  timing: RouteHookTiming,
  lifecycle: 'onBeforeRouteEnter' | 'onBeforeRouteUpdate' | 'onBeforeRouteLeave',
  hook: BeforeRouteHook,
  depth: number,
}

type AfterRouteHookRegistration = {
  timing: RouteHookTiming,
  lifecycle: 'onAfterRouteEnter' | 'onAfterRouteUpdate' | 'onAfterRouteLeave',
  hook: AfterRouteHook,
  depth: number,
}

export class RouteHookStore {
  public global = new RouteHooks()
  public component = new RouteHooks()

  public addBeforeRouteHook({ lifecycle, timing, depth, hook }: BeforeRouteHookRegistration): RouteHookRemove {
    const condition = getRouteHookCondition(lifecycle)
    const store = this[timing][lifecycle]

    const wrapped: BeforeRouteHook = (to, context) => {
      if (!condition(to, context.from, depth)) {
        return
      }

      return hook(to, context)
    }

    store.add(wrapped)

    return () => store.delete(wrapped)
  }

  public addAfterRouteHook({ lifecycle, timing, depth, hook }: AfterRouteHookRegistration): RouteHookRemove {
    const condition = getRouteHookCondition(lifecycle)
    const store = this[timing][lifecycle]

    const wrapped: AfterRouteHook = (to, context) => {
      if (!condition(to, context.from, depth)) {
        return
      }

      return hook(to, context)
    }

    store.add(wrapped)

    return () => store.delete(wrapped)
  }

}