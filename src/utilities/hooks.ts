import { inject, onUnmounted } from 'vue'
import { useRouterDepth } from '@/compositions/useRouterDepth'
import { NavigationAbortError } from '@/errors/navigationAbortError'
import { RouterNotInstalledError } from '@/errors/routerNotInstalledError'
import { AddRouteHook, RouteHookCondition, ResolvedRoute, RouteHook, RouteHookRemove, RouteHookTiming, RouterPushError, RouterRejectionError, BeforeRouteHook, RouteHookAbort, AfterRouteHook } from '@/types'
import { RouterPushImplementation } from '@/types/routerPush'
import { RouterReplaceImplementation } from '@/types/routerReplace'
import { RouterReject, RouterRejectionType, asArray } from '@/utilities'
import { addRouteHookInjectionKey } from '@/utilities/createRouterHooks'

type RouteHookSuccessResponse = {
  status: 'SUCCESS',
}

type RouteHookAbortResponse = {
  status: 'ABORT',
}

type RouteHookPushResponse = {
  status: 'PUSH',
  to: Parameters<RouterPushImplementation>,
}

type RouteHookRejectResponse = {
  status: 'REJECT',
  type: RouterRejectionType,
}

type RouteHookBeforeResponse = RouteHookSuccessResponse | RouteHookPushResponse | RouteHookRejectResponse | RouteHookAbortResponse

type BeforeContext = {
  to: ResolvedRoute,
  from: ResolvedRoute,
  hooks: BeforeRouteHook[],
}

export async function before({ to, from, hooks }: BeforeContext): Promise<RouteHookBeforeResponse> {
  try {
    const results = hooks.map(callback => callback(to, {
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

type RouteHookAfterResponse = RouteHookSuccessResponse | RouteHookPushResponse | RouteHookRejectResponse

type AfterContext = {
  to: ResolvedRoute,
  from: ResolvedRoute,
  hooks: AfterRouteHook[],
}

export async function after({ to, from, hooks }: AfterContext): Promise<RouteHookAfterResponse> {
  try {
    const results = hooks.map(callback => callback(to, {
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

function componentHookFactory(type: RouteHookTiming, condition: RouteHookCondition): AddRouteHook {
  return (hookOrHooks) => {
    const depth = useRouterDepth()
    const addRouteHook = inject(addRouteHookInjectionKey)

    if (!addRouteHook) {
      throw new RouterNotInstalledError()
    }

    const remove = asArray(hookOrHooks).map(hook => {
      const wrapper: RouteHook = (to, context) => {
        if (!condition(to, context.from, depth)) {
          return
        }

        hook(to, context)
      }

      return addRouteHook(type, wrapper)
    })

    const removeAll: RouteHookRemove = () => remove.forEach(fn => fn())

    onUnmounted(removeAll)

    return removeAll
  }
}

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

export const onBeforeRouteEnter = componentHookFactory('before', isRouteEnter)
export const onBeforeRouteLeave = componentHookFactory('before', isRouteLeave)
export const onBeforeRouteUpdate = componentHookFactory('before', isRouteUpdate)