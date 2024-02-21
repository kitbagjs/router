import { inject, onUnmounted } from 'vue'
import { useRouterDepth } from '@/compositions/useRouterDepth'
import { RouterNotInstalledError } from '@/errors/routerNotInstalledError'
import { AddRouteHook, ResolvedRoute, RouteHook, RouteHookRemove, RouteHookType, RouterPushError, RouterRejectionError, RouterReplaceError } from '@/types'
import { RouterPushImplementation, RouterReject, RouterReplaceImplementation, asArray } from '@/utilities'
import { addRouteHookInjectionKey } from '@/utilities/createRouterHooks'

export type OnRouteHookError = (error: unknown) => void

type ExecuteRouteHooksContext = {
  hooks: RouteHook[],
  to: ResolvedRoute,
  from: ResolvedRoute | null,
  onRouteHookError: OnRouteHookError,
}

export async function executeRouteHooks({ hooks, to, from, onRouteHookError }: ExecuteRouteHooksContext): Promise<boolean> {
  try {
    const results = hooks.map(callback => callback(to, {
      from,
      reject: routeHookReject,
      push: routeHookPush,
      replace: routeHookReplace,
    }))

    await Promise.all(results)

  } catch (error) {
    onRouteHookError(error)

    return false
  }

  return true
}

const routeHookReject: RouterReject = (type) => {
  throw new RouterRejectionError(type)
}

const routeHookPush: RouterPushImplementation = (...parameters) => {
  throw new RouterPushError(parameters)
}

const routeHookReplace: RouterReplaceImplementation = (...parameters) => {
  throw new RouterReplaceError(parameters)
}

type ComponentHookCondition = (to: ResolvedRoute, from: ResolvedRoute | null, depth: number) => boolean

function factory(type: RouteHookType, condition: ComponentHookCondition): AddRouteHook {
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

const isComponentEnter: ComponentHookCondition = (to, from, depth) => {
  const toMatches = to.matches
  const fromMatches = from?.matches ?? []

  return toMatches.length < depth || toMatches[depth] !== fromMatches[depth]
}

export const onBeforeRouteEnter = factory('before', isComponentEnter)

const isComponentLeave: ComponentHookCondition = (to, from, depth) => {
  const toMatches = to.matches
  const fromMatches = from?.matches ?? []

  return toMatches.length < depth || toMatches[depth] !== fromMatches[depth]
}

export const onBeforeRouteLeave = factory('before', isComponentLeave)

const isComponentUpdate: ComponentHookCondition = (to, from, depth) => {
  return to.matches[depth] === from?.matches[depth]
}

export const onBeforeRouteUpdate = factory('before', isComponentUpdate)