import { RouteMiddleware } from '@/types'
import { RouterPushError, RouterRejectionError, RouterReplaceError } from '@/types/errors'
import { RouterPushImplementation } from '@/utilities/createRouterPush'
import { RouterReject } from '@/utilities/createRouterReject'
import { RouterReplaceImplementation } from '@/utilities/createRouterReplace'
import { RouterRoute } from '@/utilities/createRouterRoute'

type ExecuteMiddlewareContext = {
  middleware: RouteMiddleware[] | Set<RouteMiddleware>,
  to: RouterRoute,
  from: RouterRoute | null,
}

export async function executeMiddleware({ middleware, to, from }: ExecuteMiddlewareContext): Promise<void> {
  const results = Array.from(middleware).map(callback => callback(to, {
    from,
    reject: middlewareReject,
    push: middlewarePush,
    replace: middlewareReplace,
  }))

  await Promise.all(results)
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