import { AnyHook } from '@/types/hook'
import { toHookCallback } from '@/services/toHookCallback'
import { BeforeHook, AfterHook, BeforeEnterHook, BeforeLeaveHook, AfterEnterHook, AfterLeaveHook, HookEntry, ComponentHook, AddGlobalHooks, AddComponentHook, AfterHookRunner, BeforeHookRunner, AddBeforeEnterHook, AddBeforeUpdateHook, AddBeforeLeaveHook, AddAfterEnterHook, AddAfterUpdateHook, AddAfterLeaveHook, ErrorHookRunner, AddErrorHook, RejectionHookRunner, RejectionHook, AddRejectionHook } from '@/types/hooks'
import { getRouteHookCondition } from '@/services/hooks'
import { ContextPushError } from '@/errors/contextPushError'
import { ContextRejectionError } from '@/errors/contextRejectionError'
import { ContextAbortError } from '@/errors/contextAbortError'
import { getAfterHooksFromRoutes, getBeforeHooksFromRoutes } from '@/services/getRouteHooks'
import { getGlobalAfterHooks, getGlobalBeforeHooks } from '@/services/getGlobalRouteHooks'
import { getRejectionHooksFromRejection } from '@/services/getRejectionHooks'
import { createVueAppStore, HasVueAppStore } from '@/services/createVueAppStore'
import { createRouterKeyStore } from '@/services/createRouterKeyStore'
import { Hooks } from '@/models/hooks'
import { createRouterCallbackContext } from '@/services/createRouterCallbackContext'
import { ContextError } from '@/errors/contextError'
import { ContextRedirectError } from '@/errors/contextRedirectError'
import { createRouteHooks } from '@/services/createRouteHooks'
import { ResolvedRoute } from '@/types/resolved'
import { RedirectStatus } from '@/types/router'
import { registerHook } from '@/services/registerHook'

export const getRouterHooksKey = createRouterKeyStore<RouterHooks>()

export type RouterHooks = HasVueAppStore & {
  runBeforeRouteHooks: BeforeHookRunner,
  runAfterRouteHooks: AfterHookRunner,
  runErrorHooks: ErrorHookRunner,
  runRejectionHooks: RejectionHookRunner,
  addComponentHook: AddComponentHook,
  addGlobalRouteHooks: AddGlobalHooks,
  onBeforeRouteEnter: AddBeforeEnterHook,
  onBeforeRouteUpdate: AddBeforeUpdateHook,
  onBeforeRouteLeave: AddBeforeLeaveHook,
  onAfterRouteEnter: AddAfterEnterHook,
  onAfterRouteUpdate: AddAfterUpdateHook,
  onAfterRouteLeave: AddAfterLeaveHook,
  onError: AddErrorHook,
  onRejection: AddRejectionHook,
}

type RouterHooksOptions = {
  redirectStatus: RedirectStatus,
  onHookAdded?: (hook: ComponentHook | AnyHook) => void,
}

export function createRouterHooks({ redirectStatus, onHookAdded }: RouterHooksOptions): RouterHooks {
  const { setVueApp, runWithContext } = createVueAppStore()
  const { store: globalStore, ...globalHooks } = createRouteHooks()

  if (onHookAdded) {
    globalStore.onHookAdded.add(onHookAdded)
  }

  const componentStore = new Hooks()
  const globalStores = [globalStore]

  const runBeforeRouteHooks: BeforeHookRunner = async ({ to, from, signal, progress }) => {
    const { reject, push, replace, update, abort } = createRouterCallbackContext({ to })
    const routeHooks = getBeforeHooksFromRoutes(to, from)
    const globalHooks = getGlobalBeforeHooks(to, from, globalStores)

    const allHooks: HookEntry<BeforeHook | AnyHook>[] = [
      ...routeHooks.redirects,
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
      const results: Promise<unknown>[] = []

      // counted one at a time so a hook that throws before returning still leaves the count exact
      for (const { hook, remove } of allHooks) {
        const callback = toHookCallback(hook)
        progress?.expect(1)

        // Enter and update hooks are only in this list when to is not null, and leave hooks are only in it when from is not null. These casts are purely to satisfy the type checker.
        const result = Promise.resolve(runWithContext(() => callback(to as ResolvedRoute, {
          lifecycle: 'before',
          remove,
          from: from as ResolvedRoute,
          reject,
          push,
          replace,
          update,
          abort,
          signal,
          redirectStatus,
        })))

        progress?.track(result)
        results.push(result)
      }

      await Promise.all(results)
    } catch (error) {
      if (error instanceof ContextPushError) {
        return error.response
      }

      if (error instanceof ContextRedirectError) {
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
      value: undefined,
    }
  }

  const runAfterRouteHooks: AfterHookRunner = async ({ to, from, signal }) => {
    const { reject, push, replace, update } = createRouterCallbackContext({ to })
    const routeHooks = getAfterHooksFromRoutes(to, from)
    const globalHooks = getGlobalAfterHooks(to, from, globalStores)

    const allHooks: HookEntry<AfterHook | AnyHook>[] = [
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
      const results = allHooks.map(({ hook, remove }) => {
        const callback = toHookCallback(hook)
        // Enter and update hooks are only in this list when to is not null, and leave hooks are only in it when from is not null. These casts are purely to satisfy the type checker.
        return Promise.resolve(runWithContext(() => callback(to as ResolvedRoute, {
          lifecycle: 'after',
          remove,
          from: from as ResolvedRoute,
          reject,
          push,
          replace,
          update,
          signal,
        })))
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
      value: undefined,
    }
  }

  const runErrorHooks: ErrorHookRunner = (error, { to, from, source }) => {
    const { reject, push, replace } = createRouterCallbackContext({ to })

    const errorHooks = globalStores.flatMap((store) => store.onError)

    for (const { hook, remove } of errorHooks) {
      try {
        const callback = toHookCallback(hook)
        callback(error, { to, from, source, reject, push, replace, remove })

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

  const runRejectionHooks: RejectionHookRunner = (rejection, { to, from }) => {
    const rejectionHooks = getRejectionHooksFromRejection(rejection)

    const allHooks: HookEntry<RejectionHook>[] = [
      ...rejectionHooks.onRejection,
      ...globalStore.onRejection,
    ]

    for (const { hook, remove } of allHooks) {
      const callback = toHookCallback(hook)
      callback(rejection.type, { to, from, remove })
    }
  }

  const addComponentHook: AddComponentHook = (registration) => {
    const { lifecycle, depth, signal } = registration

    if (signal?.aborted) {
      return () => {}
    }

    onHookAdded?.(registration.hook)
    const condition = getRouteHookCondition(lifecycle)

    switch (registration.lifecycle) {
      case 'onBeforeRouteEnter':
      case 'onBeforeRouteUpdate': {
        const hook = registration.hook
        const wrapped: BeforeEnterHook = (to, context) => {
          if (!condition(to, context.from, depth)) {
            return
          }

          const callback = toHookCallback(hook)
          return callback(to, context)
        }

        return registerHook(componentStore[lifecycle], wrapped, { signal })
      }
      case 'onBeforeRouteLeave': {
        const hook = registration.hook
        const wrapped: BeforeLeaveHook = (to, context) => {
          if (!condition(to, context.from, depth)) {
            return
          }

          const callback = toHookCallback(hook)
          return callback(to, context)
        }

        return registerHook(componentStore.onBeforeRouteLeave, wrapped, { signal })
      }
      case 'onAfterRouteEnter':
      case 'onAfterRouteUpdate': {
        const hook = registration.hook
        const wrapped: AfterEnterHook = (to, context) => {
          if (!condition(to, context.from, depth)) {
            return
          }

          const callback = toHookCallback(hook)
          return callback(to, context)
        }

        return registerHook(componentStore[lifecycle], wrapped, { signal })
      }
      case 'onAfterRouteLeave': {
        const hook = registration.hook
        const wrapped: AfterLeaveHook = (to, context) => {
          if (!condition(to, context.from, depth)) {
            return
          }

          const callback = toHookCallback(hook)
          return callback(to, context)
        }

        return registerHook(componentStore.onAfterRouteLeave, wrapped, { signal })
      }
    }
  }

  const addGlobalRouteHooks: AddGlobalHooks = (stores) => {
    for (const store of stores) {
      const hooks = [
        ...store.onBeforeRouteEnter,
        ...store.onBeforeRouteUpdate,
        ...store.onBeforeRouteLeave,
        ...store.onAfterRouteEnter,
        ...store.onAfterRouteUpdate,
        ...store.onAfterRouteLeave,
      ]

      hooks.forEach(({ hook }) => onHookAdded?.(hook))
    }

    globalStores.unshift(...stores)
  }

  return {
    runBeforeRouteHooks,
    runAfterRouteHooks,
    runErrorHooks,
    runRejectionHooks,
    addComponentHook,
    addGlobalRouteHooks,
    setVueApp,
    ...globalHooks,
  }
}
