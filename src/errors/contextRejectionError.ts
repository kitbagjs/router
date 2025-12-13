import { RouterCallbackRejectResponse } from '@/services/createRouterCallbackContext'
import { ContextError } from './contextError'

export class ContextRejectionError extends ContextError {
  public response: RouterCallbackRejectResponse

  public constructor(type: string) {
    super('Uncaught ContextRejectionError')

    this.response = { status: 'REJECT', type }
  }
}
