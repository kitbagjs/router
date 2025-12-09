import { CallbackAbortResponse } from '@/services/createCallbackContext'
import { ContextError } from './ContextError'

export class ContextAbortError extends ContextError {
  public response: CallbackAbortResponse

  public constructor() {
    super('Uncaught ContextAbortError')

    this.response = { status: 'ABORT' }
  }
}
