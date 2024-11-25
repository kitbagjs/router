import { RouterPushError } from '@/errors/routerPushError'
import { RouterRejectionError } from '@/errors/routerRejectionError'
import { RegisteredRejectionType, RegisteredRouterPush, RegisteredRouterReject, RegisteredRouterReplace } from '@/types/register'
import { RouterPushOptions } from '@/types/routerPush'
import { isUrl } from '@/types/url'


/**
 * Defines the structure of a successful callback context response.
 */
export type CallbackContextSuccessResponse = {
  status: 'SUCCESS',
}

/**
 * Defines the structure of an aborted callback context response.
 */
export type CallbackContextAbortResponse = {
  status: 'ABORT',
}

/**
 * Defines the structure of a callback context response that results in a push to a new route.
 * @template T - The type of the routes configuration.
 */
export type CallbackContextPushResponse = {
  status: 'PUSH',
  to: Parameters<RegisteredRouterPush>,
}

/**
 * Defines the structure of a callback context response that results in the rejection of a route transition.
 */
export type CallbackContextRejectResponse = {
  status: 'REJECT',
  type: RegisteredRejectionType,
}

/**
 * Union type for all possible callback context responses.
 */
export type CallbackContextResponse = CallbackContextSuccessResponse | CallbackContextAbortResponse | CallbackContextPushResponse | CallbackContextRejectResponse

export type CallbackContext = {
  reject: RegisteredRouterReject,
  push: RegisteredRouterPush,
  replace: RegisteredRouterReplace,
}

export function createCallbackContext(): CallbackContext {
  const reject: RegisteredRouterReject = (type) => {
    throw new RouterRejectionError(type)
  }

  const push: RegisteredRouterPush = (...parameters: any[]) => {
    throw new RouterPushError(parameters)
  }

  const replace: RegisteredRouterPush = (source: any, paramsOrOptions?: any, maybeOptions?: any) => {
    if (isUrl(source)) {
      const options: RouterPushOptions = paramsOrOptions ?? {}
      throw new RouterPushError([source, { ...options, replace: true }])
    }

    const params = paramsOrOptions
    const options: RouterPushOptions = maybeOptions ?? {}
    throw new RouterPushError([source, params, { ...options, replace: true }])
  }

  return { reject, push, replace }
}