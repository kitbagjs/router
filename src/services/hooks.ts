import { NavigationAbortError } from '@/errors/navigationAbortError'
import { RouterPushError } from '@/errors/routerPushError'
import { RouterRejectionError } from '@/errors/routerRejectionError'
import { createCallbackContext } from '@/services/createCallbackContext'
import { RouteHookStore } from '@/services/createRouteHookStore'
import { getAfterRouteHooksFromRoutes, getBeforeRouteHooksFromRoutes } from '@/services/getRouteHooks'
import { AfterRouteHook, AfterRouteHookResponse, BeforeRouteHook, BeforeRouteHookResponse, RouteHookAbort, RouteHookLifecycle } from '@/types/hooks'
import { RegisteredRouterPush, RegisteredRouterReplace } from '@/types/register'
import { ResolvedRoute } from '@/types/resolved'
import { Routes } from '@/types/route'
import { RouterPush } from '@/types/routerPush'

type RouteHookRunners<T extends Routes> = {
  runBeforeRouteHooks: RouteHookBeforeRunner<T>,
  runAfterRouteHooks: RouteHookAfterRunner<T>,
}

type BeforeContext = {
  to: ResolvedRoute,
  from: ResolvedRoute,
  hooks: RouteHookStore,
}

type RouteHookBeforeRunner<T extends Routes> = (context: BeforeContext) => Promise<BeforeRouteHookResponse<T>>

type AfterContext = {
  to: ResolvedRoute,
  from: ResolvedRoute,
  hooks: RouteHookStore,
}

type RouteHookAfterRunner<T extends Routes> = (context: AfterContext) => Promise<AfterRouteHookResponse<T>>

export function createRouteHookRunners<const T extends Routes>(): RouteHookRunners<T> {
  const { reject, push, replace } = createCallbackContext()

  const abort: RouteHookAbort = () => {
    throw new NavigationAbortError()
  }

  async function runBeforeRouteHooks({ to, from, hooks }: BeforeContext): Promise<BeforeRouteHookResponse<T>> {
    const { global, component } = hooks
    const route = getBeforeRouteHooksFromRoutes(to, from)

    const allHooks: BeforeRouteHook[] = [
      ...global.onBeforeRouteEnter,
      ...route.onBeforeRouteEnter,
      ...global.onBeforeRouteUpdate,
      ...route.onBeforeRouteUpdate,
      ...component.onBeforeRouteUpdate,
      ...global.onBeforeRouteLeave,
      ...route.onBeforeRouteLeave,
      ...component.onBeforeRouteLeave,
    ]

    try {
      const results = allHooks.map(callback => callback(to, {
        from,
        reject,
        push,
        replace,
        abort,
      }))

      await Promise.all(results)

    } catch (error) {
      if (error instanceof RouterPushError) {
        return {
          status: 'PUSH',
          to: error.to as Parameters<RouterPush<T>>,
        }
      }

      if (error instanceof RouterRejectionError) {
        return {
          status: 'REJECT',
          type: error.type,
        }
      }

      if (error instanceof NavigationAbortError) {
        return {
          status: 'ABORT',
        }
      }

      throw error
    }

    return {
      status: 'SUCCESS',
    }
  }

  async function runAfterRouteHooks({ to, from, hooks }: AfterContext): Promise<AfterRouteHookResponse<T>> {
    const { global, component } = hooks
    const route = getAfterRouteHooksFromRoutes(to, from)

    const allHooks: AfterRouteHook[] = [
      ...component.onAfterRouteLeave,
      ...route.onAfterRouteLeave,
      ...global.onAfterRouteLeave,
      ...component.onAfterRouteUpdate,
      ...route.onAfterRouteUpdate,
      ...global.onAfterRouteUpdate,
      ...component.onAfterRouteEnter,
      ...route.onAfterRouteEnter,
      ...global.onAfterRouteEnter,
    ]

    try {
      const results = allHooks.map(callback => callback(to, {
        from,
        reject,
        push: push as RegisteredRouterPush,
        replace: replace as RegisteredRouterReplace,
      }))

      await Promise.all(results)

    } catch (error) {
      if (error instanceof RouterPushError) {
        return {
          status: 'PUSH',
          to: error.to as Parameters<RouterPush<T>>,
        }
      }

      if (error instanceof RouterRejectionError) {
        return {
          status: 'REJECT',
          type: error.type,
        }
      }

      throw error
    }

    return {
      status: 'SUCCESS',
    }
  }

  return {
    runBeforeRouteHooks,
    runAfterRouteHooks,
  }
}

export type RouteHookCondition = (to: ResolvedRoute, from: ResolvedRoute | null, depth: number) => boolean

export const isRouteEnter: RouteHookCondition = (to, from, depth) => {
  const toMatches = to.matches
  const fromMatches = from?.matches ?? []

  return toMatches.length < depth || toMatches[depth] !== fromMatches[depth]
}

export const isRouteLeave: RouteHookCondition = (to, from, depth) => {
  const toMatches = to.matches
  const fromMatches = from?.matches ?? []

  return toMatches.length < depth || toMatches[depth] !== fromMatches[depth]
}

export const isRouteUpdate: RouteHookCondition = (to, from, depth) => {
  return to.matches[depth] === from?.matches[depth]
}

export function getRouteHookCondition(lifecycle: RouteHookLifecycle): RouteHookCondition {
  switch (lifecycle) {
    case 'onBeforeRouteEnter':
    case 'onAfterRouteEnter':
      return isRouteEnter
    case 'onBeforeRouteUpdate':
    case 'onAfterRouteUpdate':
      return isRouteUpdate
    case 'onBeforeRouteLeave':
    case 'onAfterRouteLeave':
      return isRouteLeave
    default:
      throw new Error(`Switch is not exhaustive for lifecycle: ${lifecycle satisfies never}`)
  }
}