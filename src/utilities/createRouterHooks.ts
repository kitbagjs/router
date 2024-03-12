import { InjectionKey } from 'vue'
import { AddRouteHook, ResolvedRoute, RouteHook, RouteHookRemove, RouteHookTiming } from '@/types'
import { asArray } from '@/utilities/array'

type AddRouteHookForLifeCycle = (type: RouteHookTiming, hook: RouteHook) => RouteHookRemove
export type RouteHooks = Record<RouteHookTiming, Set<RouteHook>>

export const addRouteHookInjectionKey: InjectionKey<AddRouteHookForLifeCycle> = Symbol()

export type RouterHooks = {
  onBeforeRouteEnter: AddRouteHook,
  onBeforeRouteUpdate: AddRouteHook,
  onBeforeRouteLeave: AddRouteHook,
  addRouteHook: AddRouteHookForLifeCycle,
  hooks: RouteHooks,
}

type GlobalHookCondition = (to: ResolvedRoute, from: ResolvedRoute | null) => boolean

const isGlobalEnter: GlobalHookCondition = (to, from) => {
  return to.matches[1] !== from?.matches[1]
}

const isGlobalUpdate: GlobalHookCondition = (to, from) => {
  return to.matches.some((route, depth) => route === from?.matches[depth])
}

const isGlobalLeave: GlobalHookCondition = (to, from) => {
  return to.matches[1] !== from?.matches[1]
}

export function createRouterHooks(): RouterHooks {
  const hooks: RouteHooks = {
    before: new Set(),
    after: new Set(),
  }

  const factory = (type: RouteHookTiming, condition: GlobalHookCondition): AddRouteHook => {
    return (hookOrHooks) => {
      const remove = asArray(hookOrHooks).map(hook => {
        const wrapper: RouteHook = (to, context) => {
          if (!condition(to, context.from)) {
            return
          }

          hook(to, context)
        }

        hooks[type].add(wrapper)

        return () => hooks[type].delete(wrapper)
      })

      return () => remove.forEach(fn => fn())
    }
  }

  const addRouteHook: AddRouteHookForLifeCycle = (type, hook) => {
    hooks[type].add(hook)

    return () => hooks[type].delete(hook)
  }

  return {
    onBeforeRouteEnter: factory('before', isGlobalEnter),
    onBeforeRouteUpdate: factory('before', isGlobalUpdate),
    onBeforeRouteLeave: factory('before', isGlobalLeave),
    addRouteHook,
    hooks,
  }
}