import { DeepReadonly } from 'vue'
import { Resolved, Route } from '@/types'
import { RouterPushError, RouterRejectionError, RouterReplaceError } from '@/types/errors'
import { RouterPushImplementation } from '@/utilities/createRouterPush'
import { RouterReject, notFoundRouteResolved } from '@/utilities/createRouterReject'
import { RouterReplaceImplementation } from '@/utilities/createRouterReplace'
import { getRouteMiddleware } from '@/utilities/routes'

type ExecuteMiddlewareContext = {
  to: DeepReadonly<Resolved<Route>>,
  from: DeepReadonly<Resolved<Route>>,
}

export async function executeMiddleware({ to, from }: ExecuteMiddlewareContext): Promise<void> {
  const middleware = getRouteMiddleware(to)

  const results = middleware.map(callback => callback(to, {
    from: getFromRoute(from),
    reject: middlewareReject,
    push: middlewarePush,
    replace: middlewareReplace,
  }))

  await Promise.all(results)
}

function getFromRoute(from: DeepReadonly<Resolved<Route>>): DeepReadonly<Resolved<Route>> | null {
  return from === notFoundRouteResolved ? null : from
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