import { ContextAbortError } from '@/errors/contextAbortError'
import { ContextPushError } from '@/errors/contextPushError'
import { ContextRejectionError } from '@/errors/contextRejectionError'
import { RegisteredRejectionType, RegisteredRouterPush, RegisteredRouterReject, RegisteredRouterReplace } from '@/types/register'
import { RouterPushOptions } from '@/types/routerPush'
import { isUrl } from '@/types/url'

/**
 * Defines the structure of a successful callback response.
 */
export type CallbackSuccessResponse = {
  status: 'SUCCESS',
}

/**
 * Defines the structure of an aborted callback response.
 */
export type CallbackAbortResponse = {
  status: 'ABORT',
}

/**
 * Defines the structure of a callback response that results in a push to a new route.
 */
export type CallbackPushResponse = {
  status: 'PUSH',
  to: Parameters<RegisteredRouterPush>,
}

/**
 * Defines the structure of a callback response that results in the rejection of a route transition.
 */
export type CallbackRejectResponse = {
  status: 'REJECT',
  type: RegisteredRejectionType,
}

/**
 * A function that can be called to abort a routing operation.
 */
export type CallbackContextAbort = () => void

/**
 * @deprecated Use `RouterCallbackContext` instead.
 */
export type CallbackContext = {
  reject: RegisteredRouterReject,
  push: RegisteredRouterPush,
  replace: RegisteredRouterReplace,
  abort: CallbackContextAbort,
}

/**
 * @deprecated Use `createRouterCallbackContext` instead.
 */
export function createCallbackContext(): CallbackContext {
  const reject: RegisteredRouterReject = (type) => {
    throw new ContextRejectionError(type)
  }

  const push: RegisteredRouterPush = (...parameters: any[]) => {
    throw new ContextPushError(parameters)
  }

  const replace: RegisteredRouterPush = (source: any, paramsOrOptions?: any, maybeOptions?: any) => {
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
