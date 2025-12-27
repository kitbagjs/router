import { ContextAbortError } from '@/errors/contextAbortError'
import { ContextPushError } from '@/errors/contextPushError'
import { ContextRejectionError } from '@/errors/contextRejectionError'
import { RouterPush, RouterPushOptions } from '@/types/routerPush'
import { RouterReject } from '@/types/routerReject'
import { RouterReplace } from '@/types/routerReplace'
import { isUrl } from '@/types/url'
import { BuiltInRejectionType } from './createRouterReject'
import { AsString } from '@/types/utilities'
import { Routes } from '@/types/route'
import { Rejections } from '@/types/rejection'
import { RouteUpdate } from '@/types/routeUpdate'
import { ResolvedRoute } from '@/types/resolved'

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
export type RouterCallbackRejectResponse<TRejections extends string> = {
  status: 'REJECT',
  type: AsString<TRejections> | BuiltInRejectionType,
}

/**
 * A function that can be called to abort a routing operation.
 */
export type CallbackContextAbort = () => void

export type RouterCallbackContext<
  TRoutes extends Routes = Routes,
  TRejections extends Rejections = Rejections
> = {
  reject: RouterReject<TRejections>,
  push: RouterPush<TRoutes>,
  replace: RouterReplace<TRoutes>,
  update: RouteUpdate<ResolvedRoute<TRoutes[number]>>,
  abort: CallbackContextAbort,
}

export function createRouterCallbackContext<
  TRoutes extends Routes,
  TRejections extends Rejections
>({ to }: { to: ResolvedRoute }): RouterCallbackContext<TRoutes, TRejections>

export function createRouterCallbackContext({ to }: { to: ResolvedRoute }): RouterCallbackContext {
  const reject: RouterCallbackContext['reject'] = (type) => {
    throw new ContextRejectionError(type)
  }

  const push: RouterCallbackContext['push'] = (...parameters: any[]) => {
    throw new ContextPushError(parameters)
  }

  const replace: RouterCallbackContext['replace'] = (source: any, paramsOrOptions?: any, maybeOptions?: any) => {
    if (isUrl(source)) {
      const options: RouterPushOptions = paramsOrOptions ?? {}
      throw new ContextPushError([source, { ...options, replace: true }])
    }

    const params = paramsOrOptions
    const options: RouterPushOptions = maybeOptions ?? {}
    throw new ContextPushError([source, params, { ...options, replace: true }])
  }

  const update: RouterCallbackContext['update'] = (nameOrParams: PropertyKey | Partial<ResolvedRoute['params']>, valueOrOptions?: any, maybeOptions?: RouterPushOptions) => {
    if (typeof nameOrParams === 'object') {
      const params = {
        ...to.params,
        ...nameOrParams,
      }

      return push(to.name, params, valueOrOptions)
    }

    const params = {
      ...to.params,
      [nameOrParams]: valueOrOptions,
    }

    return push(to.name, params, maybeOptions)
  }

  const abort: CallbackContextAbort = () => {
    throw new ContextAbortError()
  }

  return { reject, push, replace, update, abort }
}
