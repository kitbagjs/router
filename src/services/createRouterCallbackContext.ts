import { ContextAbortError } from '@/errors/contextAbortError'
import { ContextPushError } from '@/errors/contextPushError'
import { ContextRejectionError } from '@/errors/contextRejectionError'
import { Router, RouterRejections, RouterRoutes } from '@/types/router'
import { RouterPush, RouterPushOptions } from '@/types/routerPush'
import { RouterReject } from '@/types/routerReject'
import { RouterReplace } from '@/types/routerReplace'
import { isUrl } from '@/types/url'
import { InjectionKey } from 'vue'
import { BuiltInRejectionType } from './createRouterReject'
import { AsString } from '@/types/utilities'
import { Routes } from '@/types/route'

/**
 * Defines the structure of a successful callback response.
 */
export type RouterCallbackSuccessResponse = {
  status: 'SUCCESS',
}

/**
 * Defines the structure of an aborted callback response.
 */
export type RouterCallbackAbortResponse = {
  status: 'ABORT',
}

/**
 * Defines the structure of a callback response that results in a push to a new route.
 */
export type RouterCallbackPushResponse<TRoutes extends Routes> = {
  status: 'PUSH',
  to: Parameters<RouterPush<TRoutes>>,
}

/**
 * Defines the structure of a callback response that results in the rejection of a route transition.
 */
export type RouterCallbackRejectResponse<TRejections extends PropertyKey> = {
  status: 'REJECT',
  type: AsString<TRejections> | BuiltInRejectionType,
}

/**
 * A function that can be called to abort a routing operation.
 */
export type CallbackContextAbort = () => void

export type RouterCallbackContext<TRouter extends Router> = {
  reject: RouterReject<RouterRejections<TRouter>>,
  push: RouterPush<RouterRoutes<TRouter>>,
  replace: RouterReplace<RouterRoutes<TRouter>>,
  abort: CallbackContextAbort,
}

export function createRouterCallbackContext<TRouter extends Router>(_routerKey: InjectionKey<TRouter>): RouterCallbackContext<TRouter> {
  type TRoutes = RouterRoutes<TRouter>
  type TRejections = RouterRejections<TRouter>

  const reject: RouterReject<TRejections> = (type: any) => {
    throw new ContextRejectionError(type)
  }

  const push: RouterPush<TRoutes> = (...parameters: any[]) => {
    throw new ContextPushError(parameters)
  }

  const replace: RouterReplace<TRoutes> = (source: any, paramsOrOptions?: any, maybeOptions?: any) => {
    if (isUrl(source)) {
      const options: RouterPushOptions = paramsOrOptions ?? {}
      throw new ContextPushError([source, { ...options, replace: true }])
    }

    const params = paramsOrOptions
    const options: RouterPushOptions = maybeOptions ?? {}
    throw new ContextPushError([source, params, { ...options, replace: true }])
  }

  const abort: CallbackContextAbort = () => {
    throw new ContextAbortError()
  }

  return { reject, push, replace, abort }
}
