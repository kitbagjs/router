import { AddGlobalHooks, AddComponentAfterHook, AddComponentBeforeHook, AfterHookRunner, BeforeHookRunner, AddBeforeEnterHook, AddBeforeUpdateHook, AddBeforeLeaveHook, AddAfterEnterHook, AddAfterUpdateHook, AddAfterLeaveHook, ErrorHookRunner, AddErrorHook, BeforeEnterHook, BeforeUpdateHook, BeforeLeaveHook, AfterEnterHook, AfterUpdateHook, AfterLeaveHook } from '@/types/hooks'
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
        return runWithContext(() => {
          if (from === null) {
            return
          }
          return callback(to, {
            from,
            reject,
            push,
            replace,
            update,
            abort,
          })
        })
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
        return runWithContext(() => {
          if (from === null) {
            return
          }
          return callback(to, {
            from,
            reject,
            push,
            replace,
            update,
          })
        })
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

  const addComponentBeforeRouteHook: AddComponentBeforeHook = ({ lifecycle, depth, hook }) => {
    const condition = getRouteHookCondition(lifecycle)
    const hooks = componentStore[lifecycle]

    if (lifecycle === 'onBeforeRouteEnter') {
      const wrapped = hook as BeforeEnterHook
      const checked: BeforeEnterHook = (to, context) => {
        if (!condition(to, context.from, depth)) {
          return
        }
        return wrapped(to, context)
      }
      hooks.add(checked)
      return () => hooks.delete(checked)
    }

    if (lifecycle === 'onBeforeRouteUpdate') {
      const wrapped = hook as BeforeUpdateHook
      const checked: BeforeUpdateHook = (to, context) => {
        if (!condition(to, context.from, depth)) {
          return
        }
        return wrapped(to, context)
      }
      hooks.add(checked)
      return () => hooks.delete(checked)
    }

    // lifecycle === 'onBeforeRouteLeave'
    const wrapped = hook as BeforeLeaveHook
    const checked = ((to: any, context: any) => {
      if (!condition(to, context.from, depth)) {
        return
      }
      return wrapped(to, context)
    }) as BeforeLeaveHook
    ;(hooks as Set<BeforeLeaveHook>).add(checked)
    return () => (hooks as Set<BeforeLeaveHook>).delete(checked)
  }

  const addComponentAfterRouteHook: AddComponentAfterHook = ({ lifecycle, depth, hook }) => {
    const condition = getRouteHookCondition(lifecycle)
    const hooks = componentStore[lifecycle]

    if (lifecycle === 'onAfterRouteEnter') {
      const wrapped = hook as AfterEnterHook
      const checked: AfterEnterHook = (to, context) => {
        if (!condition(to, context.from, depth)) {
          return
        }
        return wrapped(to, context)
      }
      hooks.add(checked)
      return () => hooks.delete(checked)
    }

    if (lifecycle === 'onAfterRouteUpdate') {
      const wrapped = hook as AfterUpdateHook
      const checked: AfterUpdateHook = (to, context) => {
        if (!condition(to, context.from, depth)) {
          return
        }
        return wrapped(to, context)
      }
      hooks.add(checked)
      return () => hooks.delete(checked)
    }

    // lifecycle === 'onAfterRouteLeave'
    const wrapped = hook as AfterLeaveHook
    const checked = ((to: any, context: any) => {
      if (!condition(to, context.from, depth)) {
        return
      }
      return wrapped(to, context)
    }) as AfterLeaveHook
    ;(hooks as Set<AfterLeaveHook>).add(checked)
    return () => (hooks as Set<AfterLeaveHook>).delete(checked)
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
