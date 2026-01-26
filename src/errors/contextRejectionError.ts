import { CallbackContextReject } from '@/types/callbackContext'
import { ContextError } from './contextError'

export class ContextRejectionError extends ContextError {
  public response: CallbackContextReject

  public constructor(type: string) {
    super('Uncaught ContextRejectionError')

    this.response = { status: 'REJECT', type }
  }
}
