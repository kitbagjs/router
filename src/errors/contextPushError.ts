import { RegisteredRouterPush } from '@/types/register'
import { CallbackPushResponse } from '@/services/createCallbackContext'
import { ContextError } from './ContextError'

export class ContextPushError extends ContextError {
  public response: CallbackPushResponse

  public constructor(to: unknown[]) {
    super('Uncaught ContextPushError')

    this.response = { status: 'PUSH', to: to as Parameters<RegisteredRouterPush> }
  }
}
