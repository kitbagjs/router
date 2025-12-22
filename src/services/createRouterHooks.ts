import { AddGlobalRouteHooks, AfterRouteHook, AfterRouteHookResponse, BeforeRouteHook, BeforeRouteHookResponse, AddComponentAfterRouteHook, AddComponentBeforeRouteHook, RouterRouteHookAfterRunner, RouterRouteHookErrorRunner, RouterRouteHookBeforeRunner, AddRouterBeforeRouteHook, AddRouterAfterRouteHook, AddRouterErrorHook, HookContext, RouterBeforeRouteHook, RouterAfterRouteHook, RouterRouteHookErrorRunnerContext } from '@/types/hooks'
import { getRouteHookCondition } from './hooks'
import { getAfterRouteHooksFromRoutes, getBeforeRouteHooksFromRoutes } from './getRouteHooks'
import { ContextPushError } from '@/errors/contextPushError'
import { ContextRejectionError } from '@/errors/contextRejectionError'
import { ContextAbortError } from '@/errors/contextAbortError'
import { getGlobalAfterRouteHooks, getGlobalBeforeRouteHooks } from './getGlobalRouteHooks'
import { createVueAppStore, HasVueAppStore } from '@/services/createVueAppStore'
import { createRouterKeyStore } from './createRouterKeyStore'
import { RouterRouteHooks } from '@/models/RouterRouteHooks'
import { createRouterCallbackContext } from './createRouterCallbackContext'
import { ContextError } from '@/errors/contextError'

export const getRouterHooksKey = createRouterKeyStore<RouterHooks>()

export type RouterHooks = HasVueAppStore & {
  runBeforeRouteHooks: RouterRouteHookBeforeRunner,
  runAfterRouteHooks: RouterRouteHookAfterRunner,
  runErrorHooks: RouterRouteHookErrorRunner,
  addComponentBeforeRouteHook: AddComponentBeforeRouteHook,
  addComponentAfterRouteHook: AddComponentAfterRouteHook,
  addGlobalRouteHooks: AddGlobalRouteHooks,
  onBeforeRouteEnter: AddRouterBeforeRouteHook,
  onBeforeRouteUpdate: AddRouterBeforeRouteHook,
  onBeforeRouteLeave: AddRouterBeforeRouteHook,
  onAfterRouteEnter: AddRouterAfterRouteHook,
  onAfterRouteUpdate: AddRouterAfterRouteHook,
  onAfterRouteLeave: AddRouterAfterRouteHook,
  onError: AddRouterErrorHook,
}

export function createRouterHooks(): RouterHooks {
  const { setVueApp, runWithContext } = createVueAppStore()

  const store = {
    global: new RouterRouteHooks(),
    component: new RouterRouteHooks(),
  }

  const { reject, push, replace, abort } = createRouterCallbackContext()

  const onBeforeRouteEnter: AddRouterBeforeRouteHook = (hook) => {
    store.global.onBeforeRouteEnter.add(hook)

    return () => store.global.onBeforeRouteEnter.delete(hook)
  }

  const onBeforeRouteUpdate: AddRouterBeforeRouteHook = (hook) => {
    store.global.onBeforeRouteUpdate.add(hook)

    return () => store.global.onBeforeRouteUpdate.delete(hook)
  }

  const onBeforeRouteLeave: AddRouterBeforeRouteHook = (hook) => {
    store.global.onBeforeRouteLeave.add(hook)

    return () => store.global.onBeforeRouteLeave.delete(hook)
  }

  const onAfterRouteEnter: AddRouterAfterRouteHook = (hook) => {
    store.global.onAfterRouteEnter.add(hook)

    return () => store.global.onAfterRouteEnter.delete(hook)
  }

  const onAfterRouteUpdate: AddRouterAfterRouteHook = (hook) => {
    store.global.onAfterRouteUpdate.add(hook)

    return () => store.global.onAfterRouteUpdate.delete(hook)
  }

  const onAfterRouteLeave: AddRouterAfterRouteHook = (hook) => {
    store.global.onAfterRouteLeave.add(hook)

    return () => store.global.onAfterRouteLeave.delete(hook)
  }

  const onError: AddRouterErrorHook = (hook) => {
    store.global.onError.add(hook)

    return () => store.global.onError.delete(hook)
  }

  async function runBeforeRouteHooks({ to, from }: HookContext): Promise<BeforeRouteHookResponse> {
    const { global, component } = store
    const routeHooks = getBeforeRouteHooksFromRoutes(to, from)
    const globalHooks = getGlobalBeforeRouteHooks(to, from, global)

    const allHooks: (RouterBeforeRouteHook | BeforeRouteHook)[] = [
      ...globalHooks.onBeforeRouteEnter,
      ...routeHooks.onBeforeRouteEnter,
      ...globalHooks.onBeforeRouteUpdate,
      ...routeHooks.onBeforeRouteUpdate,
      ...component.onBeforeRouteUpdate,
      ...globalHooks.onBeforeRouteLeave,
      ...routeHooks.onBeforeRouteLeave,
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
      if (error instanceof ContextPushError) {
        return error.response
      }

      if (error instanceof ContextRejectionError) {
        return error.response
      }

      if (error instanceof ContextAbortError) {
        return error.response
      }

      try {
        runErrorHooks(error, { to, from, source: 'hook' })
      } catch (error) {
        if (error instanceof ContextPushError) {
          return error.response
        }

        if (error instanceof ContextRejectionError) {
          return error.response
        }

        throw error
      }
    }

    return {
      status: 'SUCCESS',
    }
  }

  async function runAfterRouteHooks({ to, from }: HookContext): Promise<AfterRouteHookResponse> {
    const { global, component } = store
    const routeHooks = getAfterRouteHooksFromRoutes(to, from)
    const globalHooks = getGlobalAfterRouteHooks(to, from, global)

    const allHooks: (RouterAfterRouteHook | AfterRouteHook)[] = [
      ...component.onAfterRouteLeave,
      ...routeHooks.onAfterRouteLeave,
      ...globalHooks.onAfterRouteLeave,
      ...component.onAfterRouteUpdate,
      ...routeHooks.onAfterRouteUpdate,
      ...globalHooks.onAfterRouteUpdate,
      ...component.onAfterRouteEnter,
      ...routeHooks.onAfterRouteEnter,
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
      if (error instanceof ContextPushError) {
        return error.response
      }

      if (error instanceof ContextRejectionError) {
        return error.response
      }

      try {
        runErrorHooks(error, { to, from, source: 'hook' })
      } catch (error) {
        if (error instanceof ContextPushError) {
          return error.response
        }

        if (error instanceof ContextRejectionError) {
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
   * T
   */
  function runErrorHooks(error: unknown, { to, from, source }: RouterRouteHookErrorRunnerContext): void {
    for (const hook of store.global.onError) {
      try {
        hook(error, { to, from, source, reject, push, replace })

        return
      } catch (hookError) {
        if (hookError instanceof ContextError) {
          throw hookError
        }

        if (hookError === error) {
          // Hook re-threw the same error, continue to next hook
          continue
        }

        throw hookError
      }
    }
  }

  const addComponentBeforeRouteHook: AddComponentBeforeRouteHook = ({ lifecycle, depth, hook }) => {
    const condition = getRouteHookCondition(lifecycle)
    const hooks = store.component[lifecycle]

    const wrapped: RouterBeforeRouteHook = (to, context) => {
      if (!condition(to, context.from, depth)) {
        return
      }

      return hook(to, context)
    }

    hooks.add(wrapped)

    return () => hooks.delete(wrapped)
  }

  const addComponentAfterRouteHook: AddComponentAfterRouteHook = ({ lifecycle, depth, hook }) => {
    const condition = getRouteHookCondition(lifecycle)
    const hooks = store.component[lifecycle]

    const wrapped: RouterAfterRouteHook = (to, context) => {
      if (!condition(to, context.from, depth)) {
        return
      }

      return hook(to, context)
    }

    hooks.add(wrapped)

    return () => hooks.delete(wrapped)
  }

  const addGlobalRouteHooks: AddGlobalRouteHooks = (hooks) => {
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
