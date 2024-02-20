import { InjectionKey } from 'vue'
import { RouteMiddleware } from '@/types'
import { asArray } from '@/utilities/array'
import { RouterRoute } from '@/utilities/createRouterRoute'

export type RouteHookRemove = () => void
export type AddRouteHook = (hook: RouteMiddleware) => RouteHookRemove
export type RouteHookType = 'before' | 'after'
export type RouteHookLifeCycle = 'onBeforeRouteEnter' | 'onBeforeRouteLeave' | 'onBeforeRouteUpdate'

type AddRouteHookForLifeCycle = (type: RouteHookType, hook: RouteMiddleware) => RouteHookRemove
type RouteHooks = Record<RouteHookType, Set<RouteMiddleware>>

export const addRouteHookInjectionKey: InjectionKey<AddRouteHookForLifeCycle> = Symbol()

export type RouterHooks = {
  onBeforeRouteEnter: AddRouteHook,
  onBeforeRouteUpdate: AddRouteHook,
  onBeforeRouteLeave: AddRouteHook,
  addRouteHook: AddRouteHookForLifeCycle,
  hooks: RouteHooks,
}

type GlobalHookCondition = (to: RouterRoute, from: RouterRoute | null) => boolean

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

  const factory = (type: RouteHookType, condition: GlobalHookCondition): AddRouteHook => {
    return (middleware) => {
      const remove = asArray(middleware).map(middleware => {
        const hook: RouteMiddleware = (to, context) => {
          if (!condition(to, context.from)) {
            return
          }

          middleware(to, context)
        }

        hooks[type].add(hook)

        return () => hooks[type].delete(hook)
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