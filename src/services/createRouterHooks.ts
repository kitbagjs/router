import { InjectionKey } from 'vue'
import { createRouteHookStore, RouteHookStore } from '@/services/createRouteHookStore'
import { AddAfterRouteHook, AddBeforeRouteHook } from '@/types'

export const routeHookStoreKey: InjectionKey<RouteHookStore> = Symbol()

export type RouterHooks = {
  onBeforeRouteEnter: AddBeforeRouteHook,
  onBeforeRouteUpdate: AddBeforeRouteHook,
  onBeforeRouteLeave: AddBeforeRouteHook,
  onBeforeRouteChange: AddBeforeRouteHook,
  onAfterRouteEnter: AddAfterRouteHook,
  onAfterRouteUpdate: AddAfterRouteHook,
  onAfterRouteLeave: AddAfterRouteHook,
  onAfterRouteChange: AddAfterRouteHook,
  hooks: RouteHookStore,
}

export function createRouterHooks(): RouterHooks {
  const hooks = createRouteHookStore()

  const onBeforeRouteEnter: AddBeforeRouteHook = (hook) => {
    return hooks.addBeforeRouteHook({ lifecycle: 'onBeforeRouteEnter', hook, timing: 'global', depth: 0 })
  }

  const onBeforeRouteUpdate: AddBeforeRouteHook = (hook) => {
    return hooks.addBeforeRouteHook({ lifecycle: 'onBeforeRouteUpdate', hook, timing: 'global', depth: 0 })
  }

  const onBeforeRouteChange: AddBeforeRouteHook = (hook) => {
    return hooks.addBeforeRouteHook({ lifecycle: 'onBeforeRouteChange', hook, timing: 'global', depth: 0 })
  }

  const onBeforeRouteLeave: AddBeforeRouteHook = (hook) => {
    return hooks.addBeforeRouteHook({ lifecycle: 'onBeforeRouteLeave', hook, timing: 'global', depth: 0 })
  }

  const onAfterRouteEnter: AddAfterRouteHook = (hook) => {
    return hooks.addAfterRouteHook({ lifecycle: 'onAfterRouteEnter', hook, timing: 'global', depth: 0 })
  }

  const onAfterRouteUpdate: AddAfterRouteHook = (hook) => {
    return hooks.addAfterRouteHook({ lifecycle: 'onAfterRouteUpdate', hook, timing: 'global', depth: 0 })
  }

  const onAfterRouteChange: AddAfterRouteHook = (hook) => {
    return hooks.addAfterRouteHook({ lifecycle: 'onAfterRouteChange', hook, timing: 'global', depth: 0 })
  }

  const onAfterRouteLeave: AddAfterRouteHook = (hook) => {
    return hooks.addAfterRouteHook({ lifecycle: 'onAfterRouteLeave', hook, timing: 'global', depth: 0 })
  }

  return {
    onBeforeRouteEnter,
    onBeforeRouteUpdate,
    onBeforeRouteLeave,
    onBeforeRouteChange,
    onAfterRouteEnter,
    onAfterRouteUpdate,
    onAfterRouteLeave,
    onAfterRouteChange,
    hooks,
  }
}
