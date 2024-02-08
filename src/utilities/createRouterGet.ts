import { DeepReadonly } from 'vue'
import { Resolved, Route } from '@/types'
import { RouterPushError, RouterRejectionError, RouterReplaceError } from '@/types/errors'
import { RouterPushImplementation } from '@/utilities/createRouterPush'
import { ClearRejection, GetRejectionRoute, RouterReject } from '@/utilities/createRouterReject'
import { RouterReplaceImplementation } from '@/utilities/createRouterReplace'
import { routeMatch } from '@/utilities/routeMatch'
import { getRouteMiddleware } from '@/utilities/routes'

type RouterGet = (url: string) => Promise<Resolved<Route>>

type RouterGetContext = {
  resolved: Resolved<Route>[],
  reject: RouterReject,
  getRejectionRoute: GetRejectionRoute,
  clearRejection: ClearRejection,
  route: DeepReadonly<Resolved<Route>>,
}

export function createRouterGet({ resolved, reject: routerReject, getRejectionRoute, clearRejection, route: from }: RouterGetContext): RouterGet {
  return async (url) => {
    const route = routeMatch(resolved, url)

    if (!route) {
      routerReject('NotFound')
      return getRejectionRoute('NotFound')
    }

    const middleware = getRouteMiddleware(route)

    try {
      const results = middleware.map(callback => callback(route, { from, reject, push, replace }))

      await Promise.all(results)
    } catch (error) {

    }


    clearRejection()
    return { ...route }
  }
}

const reject: RouterReject = (type) => {
  throw new RouterRejectionError(type)
}

const push: RouterPushImplementation = (...parameters) => {
  throw new RouterPushError(parameters)
}

const replace: RouterReplaceImplementation = (...parameters) => {
  throw new RouterReplaceError(parameters)
}