import { NavigationAbortError, RouterPushError, RouterRejectionError } from '@/errors'
import { RouteHookStore } from '@/models/RouteHookStore'
import { AfterRouteHook, AfterRouteHookResponse, BeforeRouteHook, BeforeRouteHookResponse, RouteHookAbort, RouteHookLifecycle } from '@/types/hooks'
import { RegisteredRouterPush, RegisteredRouterReplace } from '@/types/register'
import { ResolvedRoute } from '@/types/resolved'
import { RouterReject } from '@/types/router'
import { RouterPushOptions } from '@/types/routerPush'
import { isUrl } from '@/types/url'
import { getAfterRouteHooksFromRoutes, getBeforeRouteHooksFromRoutes } from '@/utilities/getRouteHooks'

type BeforeContext = {
  to: ResolvedRoute,
  from: ResolvedRoute,
  hooks: RouteHookStore,
}

export async function runBeforeRouteHooks({ to, from, hooks }: BeforeContext): Promise<BeforeRouteHookResponse> {
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
        to: error.to as Parameters<RegisteredRouterPush>,
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


type AfterContext = {
  to: ResolvedRoute,
  from: ResolvedRoute,
  hooks: RouteHookStore,
}

export async function runAfterRouteHooks({ to, from, hooks }: AfterContext): Promise<AfterRouteHookResponse> {
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
      push,
      replace,
    }))

    await Promise.all(results)

  } catch (error) {
    if (error instanceof RouterPushError) {
      return {
        status: 'PUSH',
        to: error.to as Parameters<RegisteredRouterPush>,
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

const reject: RouterReject = (type) => {
  throw new RouterRejectionError(type)
}

const push: RegisteredRouterPush = (source: string, ...args: any[]) => {
  throw new RouterPushError([source, ...args])
}

const replace: RegisteredRouterReplace = (source: string, ...args: any[]) => {
  if (isUrl(source)) {
    const options: RouterPushOptions = { ...args[1], replace: true }
    throw new RouterPushError([source, options])
  }

  const options: RouterPushOptions = { ...args[2], replace: true }
  throw new RouterPushError([source, args[1], options])
}

const abort: RouteHookAbort = () => {
  throw new NavigationAbortError()
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