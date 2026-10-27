import { AnyHook } from '@/types/hook'
import { toHook } from '@/services/toHook'
import { ComponentHook, AddGlobalHooks, AddComponentHook, AfterHookRunner, BeforeHookRunner, AddBeforeEnterHook, AddBeforeUpdateHook, AddBeforeLeaveHook, AddAfterEnterHook, AddAfterUpdateHook, AddAfterLeaveHook, ErrorHookRunner, AddErrorHook, RejectionHookRunner, AddRejectionHook } from '@/types/hooks'
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
import { MaybePromise } from '@/types/utilities'
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

    const allHooks = new Hooks()
    allHooks.add(routeHooks, 'redirects')
    allHooks.add(globalHooks, 'onBeforeRouteEnter')
    allHooks.add(routeHooks, 'onBeforeRouteEnter')
    allHooks.add(globalHooks, 'onBeforeRouteUpdate')
    allHooks.add(routeHooks, 'onBeforeRouteUpdate')
    allHooks.add(componentStore, 'onBeforeRouteUpdate')
    allHooks.add(globalHooks, 'onBeforeRouteLeave')
    allHooks.add(routeHooks, 'onBeforeRouteLeave')
    allHooks.add(componentStore, 'onBeforeRouteLeave')

    try {
      const results: Promise<unknown>[] = []

      // counted one at a time so a hook that throws before returning still leaves the count exact
      for (const { hook } of allHooks.getBeforeHooks()) {
        const callback = toHook(hook)
        progress?.expect(1)

        // Enter and update hooks are only in this list when to is not null, and leave hooks are only in it when from is not null. These casts are purely to satisfy the type checker.
        const result = Promise.resolve(runWithContext(() => callback(to as ResolvedRoute, {
          lifecycle: 'before',
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

    const allHooks = new Hooks()
    allHooks.add(componentStore, 'onAfterRouteLeave')
    allHooks.add(routeHooks, 'onAfterRouteLeave')
    allHooks.add(globalHooks, 'onAfterRouteLeave')
    allHooks.add(componentStore, 'onAfterRouteUpdate')
    allHooks.add(routeHooks, 'onAfterRouteUpdate')
    allHooks.add(globalHooks, 'onAfterRouteUpdate')
    allHooks.add(componentStore, 'onAfterRouteEnter')
    allHooks.add(routeHooks, 'onAfterRouteEnter')
    allHooks.add(globalHooks, 'onAfterRouteEnter')

    try {
      const results = allHooks.getAfterHooks().map(({ hook }) => {
        const callback = toHook(hook)
        // Enter and update hooks are only in this list when to is not null, and leave hooks are only in it when from is not null. These casts are purely to satisfy the type checker.
        return Promise.resolve(runWithContext(() => callback(to as ResolvedRoute, {
          lifecycle: 'after',
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

    const errorHooks = new Hooks()

    for (const store of globalStores) {
      errorHooks.add(store, 'onError')
    }

    for (const { hook } of errorHooks.get('onError')) {
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

  const runRejectionHooks: RejectionHookRunner = (rejection, { to, from }) => {
    const rejectionHooks = getRejectionHooksFromRejection(rejection)

    const allHooks = new Hooks()
    allHooks.add(rejectionHooks, 'onRejection')
    allHooks.add(globalStore, 'onRejection')

    for (const { hook } of allHooks.get('onRejection')) {
      hook(rejection.type, { to, from })
    }
  }

  const addComponentHook: AddComponentHook = ({ lifecycle, depth, hook, signal }) => {
    if (signal?.aborted) {
      return () => {}
    }

    onHookAdded?.(hook)
    const condition = getRouteHookCondition(lifecycle)

    // Using `any` here for context because its just passed through to the hook and typing it is more complex than it's worth
    const wrapped = (to: ResolvedRoute | null, context: any): MaybePromise<void> => {
      if (!condition(to, context.from, depth)) {
        return
      }

      // Only leave hooks pass the condition when to is null and those accept a null to.
      const callback = toHook(hook) as (to: ResolvedRoute | null, context: any) => MaybePromise<void>

      return callback(to, context)
    }

    return registerHook(componentStore, wrapped, lifecycle, { signal })
  }

  const addGlobalRouteHooks: AddGlobalHooks = (stores) => {
    for (const store of stores) {
      const hooks = [
        ...store.get('onBeforeRouteEnter'),
        ...store.get('onBeforeRouteUpdate'),
        ...store.get('onBeforeRouteLeave'),
        ...store.get('onAfterRouteEnter'),
        ...store.get('onAfterRouteUpdate'),
        ...store.get('onAfterRouteLeave'),
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
