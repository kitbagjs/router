import { AddGlobalRouteHooks, AfterRouteHook, AfterRouteHookResponse, BeforeRouteHook, BeforeRouteHookResponse, AddComponentAfterRouteHook, AddComponentBeforeRouteHook } from '@/types/hooks'
import { getRouteHookCondition } from './hooks'
import { getAfterRouteHooksFromRoutes, getBeforeRouteHooksFromRoutes } from './getRouteHooks'
import { CallbackContextPushError } from '@/errors/callbackContextPushError'
import { CallbackContextRejectionError } from '@/errors/callbackContextRejectionError'
import { CallbackContextAbortError } from '@/errors/callbackContextAbortError'
import { getGlobalAfterRouteHooks, getGlobalBeforeRouteHooks } from './getGlobalRouteHooks'
import { createVueAppStore, HasVueAppStore } from '@/services/createVueAppStore'
import { createRouterKeyStore } from './createRouterKeyStore'
import { AddRouterAfterRouteHook, AddRouterBeforeRouteHook, Router, RouterAfterRouteHook, RouterBeforeRouteHook, HookContext, RouterRoutes, RouterRouteHookBeforeRunner, RouterRouteHookAfterRunner, RouterRejections, AddRouterErrorHook, RouterRouteHookErrorRunner, RouterRouteHookErrorRunnerContext } from '@/types/router'
import { Routes } from '@/types/route'
import { InjectionKey } from 'vue'
import { RouterRouteHooks } from '@/models/RouterRouteHooks'
import { createRouterCallbackContext } from './createRouterCallbackContext'

export const getRouterHooksKey = createRouterKeyStore<RouterHooks<any, any>>()

export type RouterHooks<
  TRoutes extends Routes,
  TRejections extends PropertyKey
> = HasVueAppStore & {
  runBeforeRouteHooks: RouterRouteHookBeforeRunner<TRoutes>,
  runAfterRouteHooks: RouterRouteHookAfterRunner<TRoutes>,
  runErrorHooks: RouterRouteHookErrorRunner<TRoutes>,
  addComponentBeforeRouteHook: AddComponentBeforeRouteHook<TRoutes, TRejections>,
  addComponentAfterRouteHook: AddComponentAfterRouteHook<TRoutes, TRejections>,
  addGlobalRouteHooks: AddGlobalRouteHooks<TRoutes, TRejections>,
  onBeforeRouteEnter: AddRouterBeforeRouteHook<TRoutes, TRejections>,
  onBeforeRouteUpdate: AddRouterBeforeRouteHook<TRoutes, TRejections>,
  onBeforeRouteLeave: AddRouterBeforeRouteHook<TRoutes, TRejections>,
  onAfterRouteEnter: AddRouterAfterRouteHook<TRoutes, TRejections>,
  onAfterRouteUpdate: AddRouterAfterRouteHook<TRoutes, TRejections>,
  onAfterRouteLeave: AddRouterAfterRouteHook<TRoutes, TRejections>,
  onError: AddRouterErrorHook<TRoutes, TRejections>,
}

export function createRouterHooks<TRouter extends Router>(_routerKey: InjectionKey<TRouter>): RouterHooks<RouterRoutes<TRouter>, RouterRejections<TRouter>> {
  const { setVueApp, runWithContext } = createVueAppStore()

  type TRoutes = RouterRoutes<TRouter>
  type TRejections = RouterRejections<TRouter>

  const store = {
    global: new RouterRouteHooks<TRoutes, TRejections>(),
    component: new RouterRouteHooks<TRoutes, TRejections>(),
  }

  const { reject, push, replace, abort } = createRouterCallbackContext(_routerKey)

  const onBeforeRouteEnter: AddRouterBeforeRouteHook<TRoutes, TRejections> = (hook) => {
    store.global.onBeforeRouteEnter.add(hook)

    return () => store.global.onBeforeRouteEnter.delete(hook)
  }

  const onBeforeRouteUpdate: AddRouterBeforeRouteHook<TRoutes, TRejections> = (hook) => {
    store.global.onBeforeRouteUpdate.add(hook)

    return () => store.global.onBeforeRouteUpdate.delete(hook)
  }

  const onBeforeRouteLeave: AddRouterBeforeRouteHook<TRoutes, TRejections> = (hook) => {
    store.global.onBeforeRouteLeave.add(hook)

    return () => store.global.onBeforeRouteLeave.delete(hook)
  }

  const onAfterRouteEnter: AddRouterAfterRouteHook<TRoutes, TRejections> = (hook) => {
    store.global.onAfterRouteEnter.add(hook)

    return () => store.global.onAfterRouteEnter.delete(hook)
  }

  const onAfterRouteUpdate: AddRouterAfterRouteHook<TRoutes, TRejections> = (hook) => {
    store.global.onAfterRouteUpdate.add(hook)

    return () => store.global.onAfterRouteUpdate.delete(hook)
  }

  const onAfterRouteLeave: AddRouterAfterRouteHook<TRoutes, TRejections> = (hook) => {
    store.global.onAfterRouteLeave.add(hook)

    return () => store.global.onAfterRouteLeave.delete(hook)
  }

  const onError: AddRouterErrorHook<TRoutes, TRejections> = (hook) => {
    store.global.onError.add(hook)

    return () => store.global.onError.delete(hook)
  }

  async function runBeforeRouteHooks({ to, from }: HookContext<TRoutes>): Promise<BeforeRouteHookResponse> {
    const { global, component } = store
    const route = getBeforeRouteHooksFromRoutes(to, from)
    const globalHooks = getGlobalBeforeRouteHooks<TRoutes, TRejections>(to, from, global)

    const allHooks: (RouterBeforeRouteHook<TRoutes, TRejections> | BeforeRouteHook)[] = [
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
          // @ts-expect-error - This will stop erroring once route level hooks are removed
          push,
          // @ts-expect-error - This will stop erroring once route level hooks are removed
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

      try {
        runErrorHooks(error, { to, from, source: 'hook' })
      } catch (error) {
        if (error instanceof CallbackContextPushError) {
          return error.response
        }

        if (error instanceof CallbackContextRejectionError) {
          return error.response
        }

        throw error
      }
    }

    return {
      status: 'SUCCESS',
    }
  }

  async function runAfterRouteHooks({ to, from }: HookContext<TRoutes>): Promise<AfterRouteHookResponse> {
    const { global, component } = store
    const route = getAfterRouteHooksFromRoutes(to, from)
    const globalHooks = getGlobalAfterRouteHooks<TRoutes, TRejections>(to, from, global)

    const allHooks: (RouterAfterRouteHook<TRoutes, TRejections> | AfterRouteHook)[] = [
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
          // @ts-expect-error - This will stop erroring once route level hooks are removed
          push,
          // @ts-expect-error - This will stop erroring once route level hooks are removed
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

      try {
        runErrorHooks(error, { to, from, source: 'hook' })
      } catch (error) {
        if (error instanceof CallbackContextPushError) {
          return error.response
        }

        if (error instanceof CallbackContextRejectionError) {
          return error.response
        }

        throw error
      }
    }

    return {
      status: 'SUCCESS',
    }
  }

  /**
   * Returns true if the error was handled by a hook, false if the error was not handled and should be rethrown
   */
  function runErrorHooks(error: unknown, { to, from, source }: RouterRouteHookErrorRunnerContext<TRoutes>): void {
    for (const hook of store.global.onError) {
      const handled = hook(error, { to, from, source, reject, push, replace })

      if (handled) {
        return
      }
    }
  }

  const addComponentBeforeRouteHook: AddComponentBeforeRouteHook<TRoutes, TRejections> = ({ lifecycle, depth, hook }) => {
    const condition = getRouteHookCondition(lifecycle)
    const hooks = store.component[lifecycle]

    const wrapped: RouterBeforeRouteHook<TRoutes, TRejections> = (to, context) => {
      if (!condition(to, context.from, depth)) {
        return
      }

      return hook(to, context)
    }

    hooks.add(wrapped)

    return () => hooks.delete(wrapped)
  }

  const addComponentAfterRouteHook: AddComponentAfterRouteHook<TRoutes, TRejections> = ({ lifecycle, depth, hook }) => {
    const condition = getRouteHookCondition(lifecycle)
    const hooks = store.component[lifecycle]

    const wrapped: RouterAfterRouteHook<TRoutes, TRejections> = (to, context) => {
      if (!condition(to, context.from, depth)) {
        return
      }

      return hook(to, context)
    }

    hooks.add(wrapped)

    return () => hooks.delete(wrapped)
  }

  const addGlobalRouteHooks: AddGlobalRouteHooks<TRoutes, TRejections> = (hooks) => {
    hooks.onBeforeRouteEnter.forEach((hook) => onBeforeRouteEnter(hook))
    hooks.onBeforeRouteUpdate.forEach((hook) => onBeforeRouteUpdate(hook))
    hooks.onBeforeRouteLeave.forEach((hook) => onBeforeRouteLeave(hook))
    hooks.onAfterRouteEnter.forEach((hook) => onAfterRouteEnter(hook))
    hooks.onAfterRouteUpdate.forEach((hook) => onAfterRouteUpdate(hook))
    hooks.onAfterRouteLeave.forEach((hook) => onAfterRouteLeave(hook))
    hooks.onError.forEach((hook) => onError(hook))
  }

  return {
    runBeforeRouteHooks,
    runAfterRouteHooks,
    runErrorHooks,
    addComponentBeforeRouteHook,
    addComponentAfterRouteHook,
    addGlobalRouteHooks,
    onBeforeRouteEnter,
    onBeforeRouteUpdate,
    onBeforeRouteLeave,
    onAfterRouteEnter,
    onAfterRouteUpdate,
    onAfterRouteLeave,
    onError,
    setVueApp,
  }
}
