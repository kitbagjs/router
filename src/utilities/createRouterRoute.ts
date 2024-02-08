import { DeepReadonly, reactive, readonly } from 'vue'
import { Resolved, Route } from '@/types'
import { RouterPushError, RouterRejectionError, RouterReplaceError } from '@/types/errors'
import { RouterPushImplementation } from '@/utilities/createRouterPush'
import { RouterReject, notFoundRouteResolved } from '@/utilities/createRouterReject'
import { RouterReplaceImplementation } from '@/utilities/createRouterReplace'
import { RouterResolveImplementation } from '@/utilities/createRouterResolve'
import { RouterNavigation } from '@/utilities/routerNavigation'
import { getRouteMiddleware } from '@/utilities/routes'

type RouterRouteUpdate = (matched: Resolved<Route>) => void
type RouterRouteMiddleware = (matched: Resolved<Route>) => Promise<void>

type RouterRoute = {
  route: DeepReadonly<Resolved<Route>>,
  updateRoute: RouterRouteUpdate,
  executeMiddleware: RouterRouteMiddleware,
}

export function createRouterRoute(resolve: RouterResolveImplementation, navigation: RouterNavigation): RouterRoute {
  const route = reactive<Resolved<Route>>(notFoundRouteResolved)

  const setRoute = (newRoute: Resolved<Route>): void => {
    Object.assign(route, newRoute)
  }

  const updateRoute: RouterRouteUpdate = (matched: Resolved<Route>) => {
    setRoute(matched)
  }

  const executeMiddleware: RouterRouteMiddleware = async (matched) => {
    const middleware = getRouteMiddleware(matched)
    const from = route === notFoundRouteResolved ? null : readonly(route)

    try {
      const results = middleware.map(callback => callback(matched, {
        from,
        reject: middlewareReject,
        push: middlewarePush,
        replace: middlewareReplace,
      }))

      await Promise.all(results)
    } catch (error) {
      if (error instanceof RouterPushError) {
        const [source, options] = error.to
        const url = resolve(source)

        navigation.update(url, options)
      }

      if (error instanceof RouterReplaceError) {
        const [source] = error.to
        const url = resolve(source)

        navigation.update(url, { replace: true })
      }

      throw error
    }
  }

  return {
    route: readonly(route),
    updateRoute,
    executeMiddleware,
  }
}

const middlewareReject: RouterReject = (type) => {
  throw new RouterRejectionError(type)
}

const middlewarePush: RouterPushImplementation = (...parameters) => {
  throw new RouterPushError(parameters)
}

const middlewareReplace: RouterReplaceImplementation = (...parameters) => {
  throw new RouterReplaceError(parameters)
}