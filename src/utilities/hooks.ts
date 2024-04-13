import { NavigationAbortError, RouterPushError, RouterRejectionError } from '@/errors'
import { RouteHookStore } from '@/models/RouteHookStore'
import { RouterRoutes } from '@/types'
import { RouterPushError, RouterRejectionError } from '@/types/errors'
import { AfterRouteHook, AfterRouteHookResponse, BeforeRouteHook, BeforeRouteHookResponse, RouteHookAbort, RouteHookLifecycle } from '@/types/hooks'
import { ResolvedRoute } from '@/types/resolved'
import { RouterReject } from '@/types/router'
import { RegisteredRouterPush, RouterPush } from '@/types/routerPush'
import { RegisteredRouterReplace, RouterReplace } from '@/types/routerReplace'
import { getAfterRouteHooksFromRoutes, getBeforeRouteHooksFromRoutes } from '@/utilities/getRouteHooks'

type RouteHookRunners<T extends RouterRoutes> = {
  runBeforeRouteHooks: RouteHookBeforeRunner<T>,
  runAfterRouteHooks: RouteHookAfterRunner<T>,
}

type BeforeContext = {
  to: ResolvedRoute,
  from: ResolvedRoute,
  hooks: RouteHookStore,
}

type RouteHookBeforeRunner<T extends RouterRoutes> = (context: BeforeContext) => Promise<BeforeRouteHookResponse<T>>

type AfterContext = {
  to: ResolvedRoute,
  from: ResolvedRoute,
  hooks: RouteHookStore,
}

type RouteHookAfterRunner<T extends RouterRoutes> = (context: AfterContext) => Promise<AfterRouteHookResponse<T>>

export function createRouteHookRunners<const T extends RouterRoutes>(): RouteHookRunners<T> {
  const reject: RouterReject = (type) => {
    throw new RouterRejectionError(type)
  }

  const push: RouterPush<T> = (...parameters) => {
    throw new RouterPushError<T>(parameters)
  }

  const replace: RouterReplace<T> = (to, options) => {
    throw new RouterPushError<T>([to, { ...options, replace: true }])
  }

  const abort: RouteHookAbort = () => {
    throw new NavigationAbortError()
  }

  async function runBeforeRouteHooks<const T extends RouterRoutes>({ to, from, hooks }: BeforeContext): Promise<BeforeRouteHookResponse<T>> {
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
        push: push as RegisteredRouterPush,
        replace: replace as RegisteredRouterReplace,
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

  async function runAfterRouteHooks<const T extends RouterRoutes>({ to, from, hooks }: AfterContext): Promise<AfterRouteHookResponse<T>> {
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
      throw new Error(`No route hook condition for lifecycle: ${lifecycle satisfies never}`)
  }
}