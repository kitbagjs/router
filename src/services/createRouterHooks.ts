import { AddGlobalRouteHooks, AfterRouteHook, AfterRouteHookResponse, BeforeRouteHook, BeforeRouteHookResponse, AddComponentAfterRouteHook, AddComponentBeforeRouteHook } from '@/types/hooks'
import { createCallbackContext } from './createCallbackContext'
import { getRouteHookCondition } from './hooks'
import { getAfterRouteHooksFromRoutes, getBeforeRouteHooksFromRoutes } from './getRouteHooks'
import { CallbackContextPushError } from '@/errors/callbackContextPushError'
import { CallbackContextRejectionError } from '@/errors/callbackContextRejectionError'
import { CallbackContextAbortError } from '@/errors/callbackContextAbortError'
import { getGlobalAfterRouteHooks, getGlobalBeforeRouteHooks } from './getGlobalRouteHooks'
import { createVueAppStore, HasVueAppStore } from '@/services/createVueAppStore'
import { createRouterKeyStore } from './createRouterKeyStore'
import { AddRouterAfterRouteHook, AddRouterBeforeRouteHook, Router, RouterAfterRouteHook, RouterBeforeRouteHook, HookContext, RouterRoutes, RouterRouteHookBeforeRunner, RouterRouteHookAfterRunner } from '@/types/router'
import { Routes } from '@/types/route'
import { InjectionKey } from 'vue'
import { RouterRouteHooks } from '@/models/RouterRouteHooks'

export const getRouterHooksKey = createRouterKeyStore<RouterHooks<any>>()

export type RouterHooks<TRoutes extends Routes> = HasVueAppStore & {
  runBeforeRouteHooks: RouterRouteHookBeforeRunner<TRoutes>,
  runAfterRouteHooks: RouterRouteHookAfterRunner<TRoutes>,
  addComponentBeforeRouteHook: AddComponentBeforeRouteHook<TRoutes>,
  addComponentAfterRouteHook: AddComponentAfterRouteHook<TRoutes>,
  addGlobalRouteHooks: AddGlobalRouteHooks<TRoutes>,
  onBeforeRouteEnter: AddRouterBeforeRouteHook<TRoutes>,
  onBeforeRouteUpdate: AddRouterBeforeRouteHook<TRoutes>,
  onBeforeRouteLeave: AddRouterBeforeRouteHook<TRoutes>,
  onAfterRouteEnter: AddRouterAfterRouteHook<TRoutes>,
  onAfterRouteUpdate: AddRouterAfterRouteHook<TRoutes>,
  onAfterRouteLeave: AddRouterAfterRouteHook<TRoutes>,
}

export function createRouterHooks<TRouter extends Router>(_routerKey: InjectionKey<TRouter>): RouterHooks<RouterRoutes<TRouter>> {
  const { setVueApp, runWithContext } = createVueAppStore()

  type TRoutes = RouterRoutes<TRouter>

  const store = {
    global: new RouterRouteHooks<TRoutes>(),
    component: new RouterRouteHooks<TRoutes>(),
  }

  const { reject, push, replace, abort } = createCallbackContext()

  const onBeforeRouteEnter: AddRouterBeforeRouteHook<TRoutes> = (hook) => {
    store.global.onBeforeRouteEnter.add(hook)

    return () => store.global.onBeforeRouteEnter.delete(hook)
  }

  const onBeforeRouteUpdate: AddRouterBeforeRouteHook<TRoutes> = (hook) => {
    store.global.onBeforeRouteUpdate.add(hook)

    return () => store.global.onBeforeRouteUpdate.delete(hook)
  }

  const onBeforeRouteLeave: AddRouterBeforeRouteHook<TRoutes> = (hook) => {
    store.global.onBeforeRouteLeave.add(hook)

    return () => store.global.onBeforeRouteLeave.delete(hook)
  }

  const onAfterRouteEnter: AddRouterAfterRouteHook<TRoutes> = (hook) => {
    store.global.onAfterRouteEnter.add(hook)

    return () => store.global.onAfterRouteEnter.delete(hook)
  }

  const onAfterRouteUpdate: AddRouterAfterRouteHook<TRoutes> = (hook) => {
    store.global.onAfterRouteUpdate.add(hook)

    return () => store.global.onAfterRouteUpdate.delete(hook)
  }

  const onAfterRouteLeave: AddRouterAfterRouteHook<TRoutes> = (hook) => {
    store.global.onAfterRouteLeave.add(hook)

    return () => store.global.onAfterRouteLeave.delete(hook)
  }

  async function runBeforeRouteHooks({ to, from }: HookContext<TRoutes>): Promise<BeforeRouteHookResponse> {
    const { global, component } = store
    const route = getBeforeRouteHooksFromRoutes(to, from)
    const globalHooks = getGlobalBeforeRouteHooks<TRoutes>(to, from, global)

    const allHooks: (RouterBeforeRouteHook<TRoutes> | BeforeRouteHook)[] = [
      ...globalHooks.onBeforeRouteEnter,
      ...route.onBeforeRouteEnter,
      ...globalHooks.onBeforeRouteUpdate,
      ...route.onBeforeRouteUpdate,
      ...component.onBeforeRouteUpdate,
      ...globalHooks.onBeforeRouteLeave,
      ...route.onBeforeRouteLeave,
      ...component.onBeforeRouteLeave,
    ]

    try {
      const results = allHooks.map((callback) => {
        return runWithContext(() => callback(to, {
          from,
          reject,
          push,
          replace,
          abort,
        }))
      })

      await Promise.all(results)
    } catch (error) {
      if (error instanceof CallbackContextPushError) {
        return error.response
      }

      if (error instanceof CallbackContextRejectionError) {
        return error.response
      }

      if (error instanceof CallbackContextAbortError) {
        return error.response
      }

      throw error
    }

    return {
      status: 'SUCCESS',
    }
  }

  async function runAfterRouteHooks({ to, from }: HookContext<TRoutes>): Promise<AfterRouteHookResponse> {
    const { global, component } = store
    const route = getAfterRouteHooksFromRoutes(to, from)
    const globalHooks = getGlobalAfterRouteHooks<TRoutes>(to, from, global)

    const allHooks: (RouterAfterRouteHook<TRoutes> | AfterRouteHook)[] = [
      ...component.onAfterRouteLeave,
      ...route.onAfterRouteLeave,
      ...globalHooks.onAfterRouteLeave,
      ...component.onAfterRouteUpdate,
      ...route.onAfterRouteUpdate,
      ...globalHooks.onAfterRouteUpdate,
      ...component.onAfterRouteEnter,
      ...route.onAfterRouteEnter,
      ...globalHooks.onAfterRouteEnter,
    ]

    try {
      const results = allHooks.map((callback) => {
        return runWithContext(() => callback(to, {
          from,
          reject,
          push,
          replace,
        }))
      })

      await Promise.all(results)
    } catch (error) {
      if (error instanceof CallbackContextPushError) {
        return error.response
      }

      if (error instanceof CallbackContextRejectionError) {
        return error.response
      }

      throw error
    }

    return {
      status: 'SUCCESS',
    }
  }

  const addComponentBeforeRouteHook: AddComponentBeforeRouteHook<TRoutes> = ({ lifecycle, depth, hook }) => {
    const condition = getRouteHookCondition(lifecycle)
    const hooks = store.component[lifecycle]

    const wrapped: RouterBeforeRouteHook<TRoutes> = (to, context) => {
      if (!condition(to, context.from, depth)) {
        return
      }

      return hook(to, context)
    }

    hooks.add(wrapped)

    return () => hooks.delete(wrapped)
  }

  const addComponentAfterRouteHook: AddComponentAfterRouteHook<TRoutes> = ({ lifecycle, depth, hook }) => {
    const condition = getRouteHookCondition(lifecycle)
    const hooks = store.component[lifecycle]

    const wrapped: RouterAfterRouteHook<TRoutes> = (to, context) => {
      if (!condition(to, context.from, depth)) {
        return
      }

      return hook(to, context)
    }

    hooks.add(wrapped)

    return () => hooks.delete(wrapped)
  }

  const addGlobalRouteHooks: AddGlobalRouteHooks<TRoutes> = (hooks) => {
    hooks.onBeforeRouteEnter.forEach((hook) => onBeforeRouteEnter(hook))
    hooks.onBeforeRouteUpdate.forEach((hook) => onBeforeRouteUpdate(hook))
    hooks.onBeforeRouteLeave.forEach((hook) => onBeforeRouteLeave(hook))
    hooks.onAfterRouteEnter.forEach((hook) => onAfterRouteEnter(hook))
    hooks.onAfterRouteUpdate.forEach((hook) => onAfterRouteUpdate(hook))
    hooks.onAfterRouteLeave.forEach((hook) => onAfterRouteLeave(hook))
  }

  return {
    runBeforeRouteHooks,
    runAfterRouteHooks,
    addComponentBeforeRouteHook,
    addComponentAfterRouteHook,
    addGlobalRouteHooks,
    onBeforeRouteEnter,
    onBeforeRouteUpdate,
    onBeforeRouteLeave,
    onAfterRouteEnter,
    onAfterRouteUpdate,
    onAfterRouteLeave,
    setVueApp,
  }
}
