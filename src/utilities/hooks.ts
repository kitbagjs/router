import { inject, onUnmounted } from 'vue'
import { useRouterDepth } from '@/compositions/useRouterDepth'
import { NavigationAbortError } from '@/errors/navigationAbortError'
import { RouterNotInstalledError } from '@/errors/routerNotInstalledError'
import { RouterPushError, RouterRejectionError } from '@/types/errors'
import { AddRouteHook, AfterRouteHook, AfterRouteHookResponse, BeforeRouteHook, BeforeRouteHookResponse, RouteHook, RouteHookAbort, RouteHookCondition, RouteHookRemove, RouteHookTiming } from '@/types/hooks'
import { ResolvedRoute } from '@/types/resolved'
import { RouterReject } from '@/types/router'
import { RouterPushImplementation } from '@/types/routerPush'
import { RouterReplaceImplementation } from '@/types/routerReplace'
import { asArray } from '@/utilities/array'
import { RouteHooks, addRouteHookInjectionKey } from '@/utilities/createRouterHooks'
import { getRouteHooks } from '@/utilities/getRouteHooks'

type BeforeContext = {
  to: ResolvedRoute,
  from: ResolvedRoute,
  hooks: RouteHooks,
}

export async function runBeforeRouteHooks({ to, from, hooks }: BeforeContext): Promise<BeforeRouteHookResponse> {
  const allHooks: BeforeRouteHook[] = [
    ...hooks.before,
    ...getRouteHooks(to, from, 'before'),
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
  hooks: RouteHooks,
}

export async function runAfterRouteHooks({ to, from, hooks }: AfterContext): Promise<AfterRouteHookResponse> {
  const allHooks: AfterRouteHook[] = [
    ...hooks.after,
    ...getRouteHooks(to, from, 'after'),
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