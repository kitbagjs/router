import { CallbackContextAbortError } from '@/errors/callbackContextAbortError'
import { CallbackContextPushError } from '@/errors/callbackContextPushError'
import { CallbackContextRejectionError } from '@/errors/callbackContextRejectionError'
import { RouteHookStore } from '@/services/createRouteHookStore'
import { getAfterRouteHooksFromRoutes, getBeforeRouteHooksFromRoutes } from '@/services/getRouteHooks'
import { AfterRouteHook, AfterRouteHookResponse, BeforeRouteHook, BeforeRouteHookResponse, RouteHookLifecycle } from '@/types/hooks'
import { ResolvedRoute } from '@/types/resolved'
import { createCallbackContext } from './createCallbackContext'

type RouteHookRunners = {
  runBeforeRouteHooks: RouteHookBeforeRunner,
  runAfterRouteHooks: RouteHookAfterRunner,
}

type BeforeContext = {
  to: ResolvedRoute,
  from: ResolvedRoute,
  hooks: RouteHookStore,
}

type RouteHookBeforeRunner = (context: BeforeContext) => Promise<BeforeRouteHookResponse>

type AfterContext = {
  to: ResolvedRoute,
  from: ResolvedRoute,
  hooks: RouteHookStore,
}

type RouteHookAfterRunner = (context: AfterContext) => Promise<AfterRouteHookResponse>

export function createRouteHookRunners(): RouteHookRunners {
  const { reject, push, replace, abort } = createCallbackContext()

  async function runBeforeRouteHooks({ to, from, hooks }: BeforeContext): Promise<BeforeRouteHookResponse> {
    const { global, component } = hooks
    const route = getBeforeRouteHooksFromRoutes(to, from)

    const allHooks: BeforeRouteHook[] = [
      ...global.onBeforeRouteEnter,
      ...route.onBeforeRouteEnter,
      ...global.onBeforeRouteUpdate,
      ...route.onBeforeRouteUpdate,
      ...component.onBeforeRouteUpdate,
      ...global.onBeforeRouteChange,
      ...route.onBeforeRouteChange,
      ...component.onBeforeRouteChange,
      ...global.onBeforeRouteLeave,
      ...route.onBeforeRouteLeave,
      ...component.onBeforeRouteLeave,
    ]

    try {
      const results = allHooks.map((callback) => callback(to, {
        from,
        reject,
        push,
        replace,
        abort,
      }))

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

      throw error
    }

    return {
      status: 'SUCCESS',
    }
  }

  async function runAfterRouteHooks({ to, from, hooks }: AfterContext): Promise<AfterRouteHookResponse> {
    const { global, component } = hooks
    const route = getAfterRouteHooksFromRoutes(to, from)

    const allHooks: AfterRouteHook[] = [
      ...component.onAfterRouteLeave,
      ...route.onAfterRouteLeave,
      ...global.onAfterRouteLeave,
      ...component.onAfterRouteUpdate,
      ...route.onAfterRouteUpdate,
      ...global.onAfterRouteUpdate,
      ...component.onAfterRouteChange,
      ...route.onAfterRouteChange,
      ...global.onAfterRouteChange,
      ...component.onAfterRouteEnter,
      ...route.onAfterRouteEnter,
      ...global.onAfterRouteEnter,
    ]

    try {
      const results = allHooks.map((callback) => callback(to, {
        from,
        reject,
        push,
        replace,
      }))

      await Promise.all(results)
    } catch (error) {
      if (error instanceof CallbackContextPushError) {
        return error.response
      }

      if (error instanceof CallbackContextRejectionError) {
        return error.response
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

  return toMatches.length < depth || toMatches[depth].id !== fromMatches[depth]?.id
}

export const isRouteLeave: RouteHookCondition = (to, from, depth) => {
  const toMatches = to.matches
  const fromMatches = from?.matches ?? []

  return toMatches.length < depth || toMatches[depth].id !== fromMatches[depth]?.id
}

export const isRouteUpdate: RouteHookCondition = (to, from, depth) => {
  return to.matches[depth].id === from?.matches[depth]?.id
}

export const isRouteChange: RouteHookCondition = (to, from, depth) => {
  return isRouteEnter(to, from, depth) || isRouteUpdate(to, from, depth)
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
    case 'onBeforeRouteChange':
    case 'onAfterRouteChange':
      return isRouteChange
    default:
      throw new Error(`Switch is not exhaustive for lifecycle: ${lifecycle satisfies never}`)
  }
}
