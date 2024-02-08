import { DeepReadonly, reactive, readonly } from 'vue'
import { Resolved, Route } from '@/types'
import { RouterPushError, RouterRejectionError, RouterReplaceError } from '@/types/errors'
import { RouterPushImplementation } from '@/utilities/createRouterPush'
import { CreateRouterReject, RouterReject } from '@/utilities/createRouterReject'
import { RouterReplaceImplementation } from '@/utilities/createRouterReplace'
import { RouterResolveImplementation } from '@/utilities/createRouterResolve'
import { getInitialUrl } from '@/utilities/getInitialUrl'
import { routeMatch } from '@/utilities/routeMatch'
import { RouterNavigation } from '@/utilities/routerNavigation'
import { getRouteMiddleware } from '@/utilities/routes'

type RouterRouteUpdate = (url: string) => Promise<void>

type RouterRoute = {
  route: DeepReadonly<Resolved<Route>>,
  updateRoute: RouterRouteUpdate,
}

type RouterGetContext = {
  resolved: Resolved<Route>[],
  resolve: RouterResolveImplementation,
  navigation: RouterNavigation,
  routerReject: CreateRouterReject,
  initialUrl: string | undefined,
}

export function createRouterRoute({ resolved, resolve, navigation, routerReject, initialUrl }: RouterGetContext): RouterRoute {
  const { reject, getRejectionRoute, clearRejection } = routerReject
  const route = reactive<Resolved<Route>>(getRejectionRoute('NotFound'))
  const from: Resolved<Route> | null = null

  const setRoute = (newRoute: Resolved<Route>): void => {
    Object.assign(route, newRoute)
  }

  const updateRoute: RouterRouteUpdate = async (url) => {
    const matched = routeMatch(resolved, url)

    if (!matched) {
      reject('NotFound')
      setRoute(getRejectionRoute('NotFound'))
      return
    }

    const middleware = getRouteMiddleware(matched)

    try {
      const results = middleware.map(callback => callback(matched, {
        from,
        reject: middlewareReject,
        push: middlewarePush,
        replace: middlewareReplace,
      }))

      await Promise.all(results)
    } catch (error) {
      if (error instanceof RouterRejectionError) {
        reject(error.type)
        return
      }

      if (error instanceof RouterPushError) {
        const [source, options] = error.to
        const url = resolve(source)

        navigation.update(url, options)

        return
      }

      if (error instanceof RouterReplaceError) {
        const [source] = error.to
        const url = resolve(source)

        navigation.update(url, { replace: true })

        return
      }

      throw error
    }

    clearRejection()
    setRoute(matched)
  }

  updateRoute(getInitialUrl(initialUrl))

  return {
    route: readonly(route),
    updateRoute,
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