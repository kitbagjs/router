import { inject, onUnmounted } from 'vue'
import { useRouterDepth } from '@/compositions/useRouterDepth'
import { RouterNotInstalledError } from '@/errors/routerNotInstalledError'
import { AddRouteHook, RouteHookCondition, ResolvedRoute, RouteHook, RouteHookRemove, RouteHookTiming, RouterPushError, RouterRejectionError } from '@/types'
import { RouterPushImplementation } from '@/types/routerPush'
import { RouterReplaceImplementation } from '@/types/routerReplace'
import { RouterReject, asArray } from '@/utilities'
import { addRouteHookInjectionKey } from '@/utilities/createRouterHooks'

export type OnRouteHookError = (error: unknown) => void

type ExecuteRouteHooksContext = {
  hooks: RouteHook[],
  to: ResolvedRoute,
  from: ResolvedRoute | null,
  onRouteHookError: OnRouteHookError,
}

type RouteHookAbort = {
  kind: 'ABORT'
}

type RouteHookPush = {
  kind: 'PUSH',
  to: Parameters<RouterPushImplementation>
}

type RouteHookReject = {
  kind: 'REJECT',
  type: RouterRejectionType,
}

type RouteHookBeforeResponse = RouteHookPush | RouteHookReject | RouteHookAbort

type BeforeContext = {
  to: ResolvedRoute,
  from: ResolvedRoute,
  hooks: BeforeRouteHook[]
}

function before({ to, from, hooks}: BeforeContext): RouteHookBeforeResponse {
  try {
    const results = hooks.map(callback => callback(to, {
      from,
      reject,
      push,
      replace,
      abort,
    }))

    await Promise.all(results)

  } catch(error) {
    if(error instanceof RouterPushError) {
      return {
        kind: 'PUSH',
        to: error.to
      }
    }

    if(error instanceof RouterRejectionError) {
      return {
        kind: 'REJECT',
        type: error.type
      }
    }

    if(error instanceof RouterAbortError) {
      return {
        kind: 'ABORT'
      }
    }

    throw error
  }
}

type RouteHookAfterResponse = RouteHookPush | RouteHookReject

type AfterContext = {
  to: ResolvedRoute,
  from: ResolvedRoute,
  hooks: AfterRouteHook[]
}

function after({ to, from, hooks }: AfterContext): RouteHookAfterResponse {
  try {
    const results = hooks.map(callback => callback(to, {
      from,
      reject,
      push,
      replace,
      abort,
    }))

    await Promise.all(results)

  } catch(error) {
    if(error instanceof RouterPushError) {
      return {
        kind: 'PUSH',
        to: error.to
      }
    }

    if(error instanceof RouterRejectionError) {
      return {
        kind: 'REJECT',
        type: error.type
      }
    }

    throw error
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