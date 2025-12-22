import { CallbackRejectResponse } from '@/services/createCallbackContext'
import { ContextError } from './contextError'

export class ContextRejectionError extends ContextError {
  public response: CallbackRejectResponse

  public constructor(type: string) {
    super('Uncaught ContextRejectionError')

    this.response = { status: 'REJECT', type }
  }
}
