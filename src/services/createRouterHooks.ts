import { AddGlobalHooks, AddComponentAfterHook, AddComponentBeforeHook, AfterHookRunner, BeforeHookRunner, AddBeforeHook, AddAfterHook, BeforeHook, ErrorHookRunner, AddErrorHook, AfterHook } from '@/types/hooks'
import { getRouteHookCondition } from './hooks'
import { getAfterHooksFromRoutes, getBeforeHooksFromRoutes } from './getRouteHooks'
import { ContextPushError } from '@/errors/contextPushError'
import { ContextRejectionError } from '@/errors/contextRejectionError'
import { ContextAbortError } from '@/errors/contextAbortError'
import { getGlobalAfterHooks, getGlobalBeforeHooks } from './getGlobalRouteHooks'
import { createVueAppStore, HasVueAppStore } from '@/services/createVueAppStore'
import { createRouterKeyStore } from './createRouterKeyStore'
import { Hooks } from '@/models/hooks'
import { createRouterCallbackContext } from './createRouterCallbackContext'
import { ContextError } from '@/errors/contextError'
import { createHooksFactory } from './createHooksFactory'

export const getRouterHooksKey = createRouterKeyStore<RouterHooks>()

export type RouterHooks = HasVueAppStore & {
  runBeforeRouteHooks: BeforeHookRunner,
  runAfterRouteHooks: AfterHookRunner,
  runErrorHooks: ErrorHookRunner,
  addComponentBeforeRouteHook: AddComponentBeforeHook,
  addComponentAfterRouteHook: AddComponentAfterHook,
  addGlobalRouteHooks: AddGlobalHooks,
  onBeforeRouteEnter: AddBeforeHook,
  onBeforeRouteUpdate: AddBeforeHook,
  onBeforeRouteLeave: AddBeforeHook,
  onAfterRouteEnter: AddAfterHook,
  onAfterRouteUpdate: AddAfterHook,
  onAfterRouteLeave: AddAfterHook,
  onError: AddErrorHook,
}

export function createRouterHooks(): RouterHooks {
  const { setVueApp, runWithContext } = createVueAppStore()
  const { store: globalStore, ...globalHooks } = createHooksFactory()

  const componentStore = new Hooks()

  const runBeforeRouteHooks: BeforeHookRunner = async ({ to, from }) => {
    const { reject, push, replace, update, abort } = createRouterCallbackContext({ to })
    const routeHooks = getBeforeHooksFromRoutes(to, from)
    const globalHooks = getGlobalBeforeHooks(to, from, globalStore)

    const allHooks: BeforeHook[] = [
      ...globalHooks.onBeforeRouteEnter,
      ...routeHooks.onBeforeRouteEnter,
      ...globalHooks.onBeforeRouteUpdate,
      ...routeHooks.onBeforeRouteUpdate,
      ...componentStore.onBeforeRouteUpdate,
      ...globalHooks.onBeforeRouteLeave,
      ...routeHooks.onBeforeRouteLeave,
      ...componentStore.onBeforeRouteLeave,
    ]

    try {
      const results = allHooks.map((callback) => {
        return runWithContext(() => callback(to, {
          from,
          reject,
          push,
          replace,
          update,
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

  const runAfterRouteHooks: AfterHookRunner = async ({ to, from }) => {
    const { reject, push, replace, update } = createRouterCallbackContext({ to })
    const routeHooks = getAfterHooksFromRoutes(to, from)
    const globalHooks = getGlobalAfterHooks(to, from, globalStore)

    const allHooks: AfterHook[] = [
      ...componentStore.onAfterRouteLeave,
      ...routeHooks.onAfterRouteLeave,
      ...globalHooks.onAfterRouteLeave,
      ...componentStore.onAfterRouteUpdate,
      ...routeHooks.onAfterRouteUpdate,
      ...globalHooks.onAfterRouteUpdate,
      ...componentStore.onAfterRouteEnter,
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
          update,
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

  const runErrorHooks: ErrorHookRunner = (error, { to, from, source }) => {
    const { reject, push, replace, update } = createRouterCallbackContext({ to })

    for (const hook of globalStore.onError) {
      try {
        hook(error, { to, from, source, reject, push, replace, update })

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

  const addComponentBeforeRouteHook: AddComponentBeforeHook = ({ lifecycle, depth, hook }) => {
    const condition = getRouteHookCondition(lifecycle)
    const hooks = componentStore[lifecycle]

    const wrapped: BeforeHook = (to, context) => {
      if (!condition(to, context.from, depth)) {
        return
      }

      return hook(to, context)
    }

    hooks.add(wrapped)

    return () => hooks.delete(wrapped)
  }

  const addComponentAfterRouteHook: AddComponentAfterHook = ({ lifecycle, depth, hook }) => {
    const condition = getRouteHookCondition(lifecycle)
    const hooks = componentStore[lifecycle]

    const wrapped: AfterHook = (to, context) => {
      if (!condition(to, context.from, depth)) {
        return
      }

      return hook(to, context)
    }

    hooks.add(wrapped)

    return () => hooks.delete(wrapped)
  }

  const addGlobalRouteHooks: AddGlobalHooks = (hooks) => {
    hooks.onBeforeRouteEnter.forEach((hook) => globalHooks.onBeforeRouteEnter(hook))
    hooks.onBeforeRouteUpdate.forEach((hook) => globalHooks.onBeforeRouteUpdate(hook))
    hooks.onBeforeRouteLeave.forEach((hook) => globalHooks.onBeforeRouteLeave(hook))
    hooks.onAfterRouteEnter.forEach((hook) => globalHooks.onAfterRouteEnter(hook))
    hooks.onAfterRouteUpdate.forEach((hook) => globalHooks.onAfterRouteUpdate(hook))
    hooks.onAfterRouteLeave.forEach((hook) => globalHooks.onAfterRouteLeave(hook))
    hooks.onError.forEach((hook) => globalHooks.onError(hook))
  }

  return {
    runBeforeRouteHooks,
    runAfterRouteHooks,
    runErrorHooks,
    addComponentBeforeRouteHook,
    addComponentAfterRouteHook,
    addGlobalRouteHooks,
    setVueApp,
    ...globalHooks,
  }
}
