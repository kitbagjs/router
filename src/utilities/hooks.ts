import { onUnmounted } from 'vue'
import { useAddRouteHook } from '@/compositions/useAddRouteHook'
import { useRouterDepth } from '@/compositions/useRouterDepth'
import { NavigationAbortError } from '@/errors/navigationAbortError'
import { RouteHooksStore } from '@/models/RouteHooksStore'
import { RouterPushError, RouterRejectionError } from '@/types/errors'
import { AddAfterRouteHook, AddBeforeRouteHook, AfterRouteHook, AfterRouteHookLifecycle, AfterRouteHookResponse, BeforeRouteHook, BeforeRouteHookLifecycle, BeforeRouteHookResponse, RouteHookAbort, RouteHookLifecycle } from '@/types/hooks'
import { ResolvedRoute } from '@/types/resolved'
import { RouterReject } from '@/types/router'
import { RouterPushImplementation } from '@/types/routerPush'
import { RouterReplaceImplementation } from '@/types/routerReplace'
import { getAfterRouteHooksFromRoutes, getBeforeRouteHooksFromRoutes } from '@/utilities/getRouteHooks'

type BeforeContext = {
  to: ResolvedRoute,
  from: ResolvedRoute,
  hooks: RouteHooksStore,
}

export async function runBeforeRouteHooks({ to, from, hooks }: BeforeContext): Promise<BeforeRouteHookResponse> {
  const { global, component } = hooks
  const route = getBeforeRouteHooksFromRoutes(to, from)

  const allHooks: BeforeRouteHook[] = [
    ...global.onBeforeRouteEnter,
    ...global.onBeforeRouteUpdate,
    ...global.onBeforeRouteLeave,
    ...route.onBeforeRouteEnter,
    ...route.onBeforeRouteUpdate,
    ...route.onBeforeRouteLeave,
    ...component.onBeforeRouteUpdate,
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
        to: error.to,
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
  hooks: RouteHooksStore,
}

export async function runAfterRouteHooks({ to, from, hooks }: AfterContext): Promise<AfterRouteHookResponse> {
  const { global, component } = hooks
  const route = getAfterRouteHooksFromRoutes(to, from)

  const allHooks: AfterRouteHook[] = [
    ...component.onAfterRouteUpdate,
    ...component.onAfterRouteLeave,
    ...route.onAfterRouteEnter,
    ...route.onAfterRouteUpdate,
    ...route.onAfterRouteLeave,
    ...global.onAfterRouteEnter,
    ...global.onAfterRouteUpdate,
    ...global.onAfterRouteLeave,
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
        to: error.to,
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

const push: RouterPushImplementation = (...parameters) => {
  throw new RouterPushError(parameters)
}

const replace: RouterReplaceImplementation = (to, options) => {
  throw new RouterPushError([to, { ...options, replace: true }])
}

const abort: RouteHookAbort = () => {
  throw new NavigationAbortError()
}

function beforeComponentHookFactory<T extends BeforeRouteHookLifecycle>(lifecycle: T) {
  return (hook: BeforeRouteHook) => {
    const depth = useRouterDepth()
    const addRouteHook = useAddRouteHook()

    const remove = addRouteHook({ lifecycle, hook, depth, timing: 'component' })

    onUnmounted(remove)

    return remove
  }
}

function afterComponentHookFactory<T extends AfterRouteHookLifecycle>(lifecycle: T) {
  return (hook: AfterRouteHook) => {
    const depth = useRouterDepth()
    const addRouteHook = useAddRouteHook()

    const remove = addRouteHook({ lifecycle, hook, depth, timing: 'component' })

    onUnmounted(remove)

    return remove
  }
}

type RouteHookCondition = (to: ResolvedRoute, from: ResolvedRoute | null, depth: number) => boolean

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

export const onBeforeRouteLeave: AddBeforeRouteHook = beforeComponentHookFactory('onBeforeRouteUpdate')
export const onBeforeRouteUpdate: AddBeforeRouteHook = beforeComponentHookFactory('onBeforeRouteLeave')
export const onAfterRouteEnter: AddAfterRouteHook = afterComponentHookFactory('onAfterRouteEnter')
export const onAfterRouteLeave: AddAfterRouteHook = afterComponentHookFactory('onAfterRouteUpdate')
export const onAfterRouteUpdate: AddAfterRouteHook = afterComponentHookFactory('onAfterRouteLeave')