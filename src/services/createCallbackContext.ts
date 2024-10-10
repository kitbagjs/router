import { RouterPushError } from '@/errors/routerPushError'
import { RouterRejectionError } from '@/errors/routerRejectionError'
import { RegisteredRouterPush, RegisteredRouterReject, RegisteredRouterReplace } from '@/types/register'
import { RouterPushOptions } from '@/types/routerPush'
import { isUrl } from '@/types/url'

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