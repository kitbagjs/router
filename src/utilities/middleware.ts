import { RouteMiddleware } from '@/types'
import { RouterPushError, RouterRejectionError, RouterReplaceError } from '@/types/errors'
import { ResolvedRoute } from '@/types/resolved'
import { RouterPushImplementation } from '@/utilities/createRouterPush'
import { RouterReject } from '@/utilities/createRouterReject'
import { RouterReplaceImplementation } from '@/utilities/createRouterReplace'

export type OnMiddlewareError = (error: unknown) => void

type ExecuteMiddlewareContext = {
  middleware: RouteMiddleware[],
  to: ResolvedRoute,
  from: ResolvedRoute | null,
  onMiddlewareError: OnMiddlewareError,
}

export async function executeMiddleware({ middleware, to, from, onMiddlewareError }: ExecuteMiddlewareContext): Promise<boolean> {
  try {
    const results = middleware.map(callback => callback(to, {
      from,
      reject: middlewareReject,
      push: middlewarePush,
      replace: middlewareReplace,
    }))

    await Promise.all(results)

  } catch (error) {
    onMiddlewareError(error)

    return false
  }

  return true
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