import { AddGlobalHooks, AddComponentHook, AfterHookRunner, BeforeHookRunner, AddBeforeEnterHook, AddBeforeUpdateHook, AddBeforeLeaveHook, AddAfterEnterHook, AddAfterUpdateHook, AddAfterLeaveHook, ErrorHookRunner, AddErrorHook, BeforeEnterHook, BeforeUpdateHook, BeforeLeaveHook, AfterEnterHook, AfterUpdateHook, AfterLeaveHook } from '@/types/hooks'
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
import { ResolvedRoute } from '@/types/resolved'
import { MaybePromise } from '@/types/utilities'

export const getRouterHooksKey = createRouterKeyStore<RouterHooks>()

export type RouterHooks = HasVueAppStore & {
  runBeforeRouteHooks: BeforeHookRunner,
  runAfterRouteHooks: AfterHookRunner,
  runErrorHooks: ErrorHookRunner,
  addComponentHook: AddComponentHook,
  addGlobalRouteHooks: AddGlobalHooks,
  onBeforeRouteEnter: AddBeforeEnterHook,
  onBeforeRouteUpdate: AddBeforeUpdateHook,
  onBeforeRouteLeave: AddBeforeLeaveHook,
  onAfterRouteEnter: AddAfterEnterHook,
  onAfterRouteUpdate: AddAfterUpdateHook,
  onAfterRouteLeave: AddAfterLeaveHook,
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

    const enterHooks: BeforeEnterHook[] = [
      ...globalHooks.onBeforeRouteEnter,
      ...routeHooks.onBeforeRouteEnter,
    ]

    const updateHooks: BeforeUpdateHook[] = [
      ...globalHooks.onBeforeRouteUpdate,
      ...routeHooks.onBeforeRouteUpdate,
      ...componentStore.onBeforeRouteUpdate,
    ]

    const leaveHooks: BeforeLeaveHook[] = [
      ...globalHooks.onBeforeRouteLeave,
      ...routeHooks.onBeforeRouteLeave,
      ...componentStore.onBeforeRouteLeave,
    ]

    try {
      const enterResults = enterHooks.map((callback) => {
        return runWithContext(() => callback(to, {
          from,
          reject,
          push,
          replace,
          update,
          abort,
        }))
      })

      const updateResults = updateHooks.map((callback) => {
        return runWithContext(() => callback(to, {
          from,
          reject,
          push,
          replace,
          update,
          abort,
        }))
      })

      const leaveResults = leaveHooks.map((callback) => {
        // there will be no leave hooks when from is null, this condition is purely for type safety
        if (from === null) {
          return
        }

        return runWithContext(() => callback(to, {
          from,
          reject,
          push,
          replace,
          update,
          abort,
        }))
      })

      await Promise.all([...enterResults, ...updateResults, ...leaveResults])
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

    const leaveHooks: AfterLeaveHook[] = [
      ...componentStore.onAfterRouteLeave,
      ...routeHooks.onAfterRouteLeave,
      ...globalHooks.onAfterRouteLeave,
    ]

    const updateHooks: AfterUpdateHook[] = [
      ...componentStore.onAfterRouteUpdate,
      ...routeHooks.onAfterRouteUpdate,
      ...globalHooks.onAfterRouteUpdate,
    ]

    const enterHooks: AfterEnterHook[] = [
      ...componentStore.onAfterRouteEnter,
      ...routeHooks.onAfterRouteEnter,
      ...globalHooks.onAfterRouteEnter,
    ]

    try {
      const leaveResults = leaveHooks.map((callback) => {
        // there will be no leave hooks when from is null, this condition is purely for type safety
        if (from === null) {
          return
        }

        return runWithContext(() => callback(to, {
          from,
          reject,
          push,
          replace,
          update,
        }))
      })

      const updateResults = updateHooks.map((callback) => {
        return runWithContext(() => callback(to, {
          from,
          reject,
          push,
          replace,
          update,
        }))
      })

      const enterResults = enterHooks.map((callback) => {
        return runWithContext(() => callback(to, {
          from,
          reject,
          push,
          replace,
          update,
        }))
      })

      await Promise.all([...leaveResults, ...updateResults, ...enterResults])
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

  const addComponentHook: AddComponentHook = ({ lifecycle, depth, hook }) => {
    const condition = getRouteHookCondition(lifecycle)
    const hooks = componentStore[lifecycle]

    // Using `any` here for context because its just passed through to the hook and typing it is more complex than it's worth
    const wrapped = (to: ResolvedRoute, context: any): MaybePromise<void> => {
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
    addComponentHook,
    addGlobalRouteHooks,
    setVueApp,
    ...globalHooks,
  }
}
