import { RouteHooks } from '@/models/RouteHooks'
import { getRouteHookCondition } from '@/services/hooks'
import { AfterRouteHook, BeforeRouteHook, RouteHookRemove } from '@/types/hooks'

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

export type RouteHookStore = {
  global: RouteHooks,
  component: RouteHooks,
  addBeforeRouteHook: (registration: BeforeRouteHookRegistration) => RouteHookRemove,
  addAfterRouteHook: (registration: AfterRouteHookRegistration) => RouteHookRemove,
}

export function createRouteHookStore(): RouteHookStore {
  const store = {
    global: new RouteHooks(),
    component: new RouteHooks(),
  }

  function addBeforeRouteHook({ lifecycle, timing, depth, hook }: BeforeRouteHookRegistration): RouteHookRemove {
    const condition = getRouteHookCondition(lifecycle)
    const hooks = store[timing][lifecycle]

    const wrapped: BeforeRouteHook = (to, context) => {
      if (!condition(to, context.from, depth)) {
        return
      }

      return hook(to, context)
    }

    hooks.add(wrapped)

    return () => hooks.delete(wrapped)
  }

  function addAfterRouteHook({ lifecycle, timing, depth, hook }: AfterRouteHookRegistration): RouteHookRemove {
    const condition = getRouteHookCondition(lifecycle)
    const hooks = store[timing][lifecycle]

    const wrapped: AfterRouteHook = (to, context) => {
      if (!condition(to, context.from, depth)) {
        return
      }

      return hook(to, context)
    }

    hooks.add(wrapped)

    return () => hooks.delete(wrapped)
  }

  return { ...store, addBeforeRouteHook, addAfterRouteHook }
}
