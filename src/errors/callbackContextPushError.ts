import { RegisteredRouterPush } from '@/types/register'
import { CallbackPushResponse } from '@/services/createCallbackContext'
import { AfterCallbackContextError } from '@/errors/afterCallbackContextError'

export class CallbackContextPushError extends AfterCallbackContextError {
  public constructor(to: unknown[]) {
    const response: CallbackPushResponse = { status: 'PUSH', to: to as Parameters<RegisteredRouterPush> }

    super('Uncaught CallbackContextPushError', response)
  }
}
