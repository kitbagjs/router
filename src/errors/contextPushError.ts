import { RouterCallbackPushResponse } from '@/services/createRouterCallbackContext'
import { ContextError } from '@/errors/contextError'

export class ContextPushError extends ContextError {
  public response: RouterCallbackPushResponse

  public constructor(to: unknown[]) {
    super('Uncaught ContextPushError')

    this.response = { status: 'PUSH', to: to as RouterCallbackPushResponse['to'] }
  }
}
