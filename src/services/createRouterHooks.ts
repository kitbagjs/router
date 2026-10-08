import { AddGlobalHooks, AddComponentHook, AddBeforeEnterHook, AddBeforeUpdateHook, AddBeforeLeaveHook, AddAfterEnterHook, AddAfterUpdateHook, AddAfterLeaveHook, ErrorHookRunner, AddErrorHook, AddRejectionHook } from '@/types/hooks'
import { getRouteHookCondition } from '@/services/hooks'
import { ContextPushError } from '@/errors/contextPushError'
import { ContextRejectionError } from '@/errors/contextRejectionError'
import { ContextAbortError } from '@/errors/contextAbortError'
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
import { BeforePageNavigation, getPageRoute, PageHook, PageHookResponse, PageNavigation } from '@/types/page'
import { bindRouteHooks, emptyPageHooks, getGlobalPageHooks } from '@/services/getPageHooks'
import { NavigationProgressTracker } from '@/services/createNavigationProgress'
import { createAbortPromise } from '@/utilities/promises'

export const getRouterHooksKey = createRouterKeyStore<RouterHooks>()

export type RouterHooks = HasVueAppStore & {
  runBeforeHooks: (navigation: BeforePageNavigation) => Promise<PageHookResponse>,
  runAfterHooks: (navigation: PageNavigation) => Promise<PageHookResponse>,
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
  onRejection: AddRejectionHook,
}

type RouterHooksOptions = {
  redirectStatus: RedirectStatus,
  ssr?: boolean,
}

export function createRouterHooks({ redirectStatus, ssr = false }: RouterHooksOptions): RouterHooks {
  const { setVueApp, runWithContext } = createVueAppStore()
  const { store: globalStore, ...globalHooks } = createRouteHooks()

  const componentStore = new Hooks()

  const runBeforeHooks: RouterHooks['runBeforeHooks'] = (navigation) => {
    const to = navigation.to.getHooks(navigation)
    const from = navigation.from?.getHooks(navigation) ?? emptyPageHooks()
    const global = getGlobalPageHooks(navigation, globalStore, redirectStatus, ssr)
    const callbacks = [
      ...to.redirects,
      ...global.beforeEnter,
      ...to.beforeEnter,
      ...global.beforeUpdate,
      ...to.beforeUpdate,
      ...bindRouteHooks(componentStore.onBeforeRouteUpdate, navigation, redirectStatus),
      ...global.beforeLeave,
      ...from.beforeLeave,
      ...bindRouteHooks(componentStore.onBeforeRouteLeave, navigation, redirectStatus),
    ]

    return runHooks(callbacks, navigation, navigation.progress)
  }

  const runAfterHooks: RouterHooks['runAfterHooks'] = (navigation) => {
    const to = navigation.to.getHooks(navigation)
    const from = navigation.from?.getHooks(navigation) ?? emptyPageHooks()
    const global = getGlobalPageHooks(navigation, globalStore, redirectStatus, ssr)
    const components = ssr ? new Hooks() : componentStore
    const callbacks = [
      ...bindRouteHooks(components.onAfterRouteLeave, navigation, redirectStatus),
      ...from.afterLeave,
      ...global.afterLeave,
      ...bindRouteHooks(components.onAfterRouteUpdate, navigation, redirectStatus),
      ...to.afterUpdate,
      ...global.afterUpdate,
      ...bindRouteHooks(components.onAfterRouteEnter, navigation, redirectStatus),
      ...to.afterEnter,
      ...global.afterEnter,
    ]

    return runHooks(callbacks, navigation)
  }

  async function runHooks(callbacks: PageHook[], navigation: PageNavigation, progress?: NavigationProgressTracker): Promise<PageHookResponse> {
    const { signal } = navigation

    try {
      const results: Promise<unknown>[] = []

      for (const callback of callbacks) {
        if (signal.aborted) {
          return { status: 'ABORT' }
        }

        progress?.expect(1)
        const result = Promise.resolve(runWithContext(callback))

        progress?.track(result)
        // A later callback can throw synchronously before the aggregate promise is created.
        result.catch(() => {})
        results.push(result)
      }

      await Promise.race([Promise.all(results), createAbortPromise(signal)])
    } catch (error) {
      if (signal.aborted) {
        return { status: 'ABORT' }
      }

      if (isHookInterruption(error)) {
        return error.response
      }

      try {
        runErrorHooks(error, { to: getPageRoute(navigation.to), from: getPageRoute(navigation.from), source: 'hook' })
      } catch (error) {
        if (isHookInterruption(error)) {
          return error.response
        }

        throw error
      }
    }

    if (signal.aborted) {
      return { status: 'ABORT' }
    }

    return { status: 'SUCCESS' }
  }

  const runErrorHooks: ErrorHookRunner = (error, { to, from, source }) => {
    const { reject, push, replace } = createRouterCallbackContext({ to })

    for (const hook of globalStore.onError) {
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

  const addComponentHook: AddComponentHook = ({ lifecycle, depth, hook }) => {
    const condition = getRouteHookCondition(lifecycle)
    const hooks = componentStore[lifecycle]

    // Using `any` here for context because its just passed through to the hook and typing it is more complex than it's worth
    const wrapped = (to: ResolvedRoute | null, context: any): MaybePromise<void> => {
      if (!condition(to, context.from, depth)) {
        return
      }

      // Only leave hooks pass the condition when to is null and those accept a null to.
      const callback = hook as (to: ResolvedRoute | null, context: any) => MaybePromise<void>

      return callback(to, context)
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
    runBeforeHooks,
    runAfterHooks,
    runErrorHooks,
    addComponentHook,
    addGlobalRouteHooks,
    setVueApp,
    ...globalHooks,
  }
}

function isHookInterruption(error: unknown): error is ContextPushError | ContextRejectionError | ContextRedirectError | ContextAbortError {
  return error instanceof ContextPushError || error instanceof ContextRejectionError || error instanceof ContextRedirectError || error instanceof ContextAbortError
}
