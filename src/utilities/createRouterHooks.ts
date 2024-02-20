import { InjectionKey } from 'vue'
import { RouteMiddleware } from '@/types'
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

function isGlobalEnter(to: RouterRoute, from: RouterRoute | null): boolean {
  return to.matches[1] !== from?.matches[1]
}

function isGlobalUpdate(to: RouterRoute, from: RouterRoute | null): boolean {
  return to.matches.some((route, depth) => route === from?.matches[depth])
}

function isGlobalLeave(to: RouterRoute, from: RouterRoute | null): boolean {
  return to.matches[1] !== from?.matches[1]
}

export function createRouterHooks(): RouterHooks {
  const hooks: RouteHooks = {
    before: new Set(),
    after: new Set(),
  }

  const onBeforeRouteEnter: AddRouteHook = (fn) => {
    const hook: RouteMiddleware = (to, context) => {
      if (!isGlobalEnter(to, context.from)) {
        return
      }

      fn(to, context)
    }

    hooks.before.add(hook)

    return () => hooks.before.delete(hook)
  }

  const onBeforeRouteUpdate: AddRouteHook = (fn) => {
    const hook: RouteMiddleware = (to, context) => {
      if (!isGlobalUpdate(to, context.from)) {
        return
      }

      fn(to, context)
    }

    hooks.before.add(hook)

    return () => hooks.before.delete(hook)
  }

  const onBeforeRouteLeave: AddRouteHook = (fn) => {
    const hook: RouteMiddleware = (to, context) => {
      if (!isGlobalLeave(to, context.from)) {
        return
      }

      fn(to, context)
    }

    hooks.after.add(hook)

    return () => hooks.after.delete(hook)
  }

  const addRouteHook: AddRouteHookForLifeCycle = (type, hook) => {
    hooks[type].add(hook)

    return () => hooks[type].delete(hook)
  }

  return {
    onBeforeRouteEnter,
    onBeforeRouteUpdate,
    onBeforeRouteLeave,
    addRouteHook,
    hooks,
  }
}