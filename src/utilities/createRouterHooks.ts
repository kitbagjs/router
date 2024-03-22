import { InjectionKey } from 'vue'
import { RouteHooksStore } from '@/models/RouteHooksStore'
import { AddAfterRouteHook, AddBeforeRouteHook, AfterRouteHook, BeforeRouteHook, RouteHook, RouteHookLifecycle, RouteHookRemove, isAfterRouteHookLifecycle, isBeforeRouteHookLifecycle } from '@/types'
import { getRouteHookCondition } from '@/utilities/hooks'

export type RouterAddRouteHook = (register: BeforeRouteHookRegistration | AfterRouteHookRegistration) => RouteHookRemove
export type RouterGetRouteHooks = (lifecycle: RouteHookLifecycle, timing: RouteHookTiming) => RouteHook[]

type RouteHookTiming = 'global' | 'component'

type BeforeRouteHookRegistration = {
  timing: RouteHookTiming,
  lifecycle: 'onBeforeRouteEnter' | 'onBeforeRouteUpdate' | 'onBeforeRouteLeave',
  hook: BeforeRouteHook,
  depth: number,
}

function isBeforeRouteHookRegistration(value: RouteHookRegistration): value is BeforeRouteHookRegistration {
  return isBeforeRouteHookLifecycle(value.lifecycle)
}

type AfterRouteHookRegistration = {
  timing: RouteHookTiming,
  lifecycle: 'onAfterRouteEnter' | 'onAfterRouteUpdate' | 'onAfterRouteLeave',
  hook: AfterRouteHook,
  depth: number,
}

function isAfterRouteHookRegistration(value: RouteHookRegistration): value is AfterRouteHookRegistration {
  return isAfterRouteHookLifecycle(value.lifecycle)
}

type RouteHookRegistration = BeforeRouteHookRegistration | AfterRouteHookRegistration

export const addRouteHookInjectionKey: InjectionKey<RouterAddRouteHook> = Symbol()

export type RouterHooks = {
  addRouteHook: RouterAddRouteHook,
  onBeforeRouteEnter: AddBeforeRouteHook,
  onBeforeRouteUpdate: AddBeforeRouteHook,
  onBeforeRouteLeave: AddBeforeRouteHook,
  onAfterRouteEnter: AddAfterRouteHook,
  onAfterRouteUpdate: AddAfterRouteHook,
  onAfterRouteLeave: AddAfterRouteHook,
  hooks: RouteHooksStore,
}

export function createRouterHooks(): RouterHooks {
  const hooks = new RouteHooksStore()

  function addBeforeRouteHook({ lifecycle, timing, depth, hook }: BeforeRouteHookRegistration): RouteHookRemove {
    const condition = getRouteHookCondition(lifecycle)
    const store = hooks[timing][lifecycle]

    const wrapped: BeforeRouteHook = (to, context) => {
      if (!condition(to, context.from, depth)) {
        return
      }

      return hook(to, context)
    }


    store.add(wrapped)

    return () => store.delete(wrapped)
  }

  function addAfterRouteHook({ lifecycle, timing, depth, hook }: AfterRouteHookRegistration): RouteHookRemove {
    const condition = getRouteHookCondition(lifecycle)
    const store = hooks[timing][lifecycle]

    const wrapped: AfterRouteHook = (to, context) => {
      if (!condition(to, context.from, depth)) {
        return
      }

      return hook(to, context)
    }


    store.add(wrapped)

    return () => store.delete(wrapped)
  }

  const addRouteHook: RouterAddRouteHook = (registration) => {
    if (isAfterRouteHookRegistration(registration)) {
      return addAfterRouteHook(registration)
    }

    if (isBeforeRouteHookRegistration(registration)) {
      return addBeforeRouteHook(registration)
    }

    const exhaustive: never = registration
    throw new Error(`addRouteHook registration has missing cause for lifecycle: ${(exhaustive as RouteHookRegistration).lifecycle}`)
  }

  const onBeforeRouteEnter: AddBeforeRouteHook = (hook) => {
    return addRouteHook({ lifecycle: 'onBeforeRouteEnter', hook, timing: 'global', depth: 0 })
  }

  const onBeforeRouteUpdate: AddBeforeRouteHook = (hook) => {
    return addRouteHook({ lifecycle: 'onBeforeRouteUpdate', hook, timing: 'global', depth: 0 })
  }

  const onBeforeRouteLeave: AddBeforeRouteHook = (hook) => {
    return addRouteHook({ lifecycle: 'onBeforeRouteLeave', hook, timing: 'global', depth: 0 })
  }

  const onAfterRouteEnter: AddAfterRouteHook = (hook) => {
    return addRouteHook({ lifecycle: 'onAfterRouteEnter', hook, timing: 'global', depth: 0 })
  }

  const onAfterRouteUpdate: AddAfterRouteHook = (hook) => {
    return addRouteHook({ lifecycle: 'onAfterRouteUpdate', hook, timing: 'global', depth: 0 })
  }

  const onAfterRouteLeave: AddAfterRouteHook = (hook) => {
    return addRouteHook({ lifecycle: 'onAfterRouteLeave', hook, timing: 'global', depth: 0 })
  }

  return {
    onBeforeRouteEnter,
    onBeforeRouteUpdate,
    onBeforeRouteLeave,
    onAfterRouteEnter,
    onAfterRouteUpdate,
    onAfterRouteLeave,
    addRouteHook,
    hooks,
  }
}