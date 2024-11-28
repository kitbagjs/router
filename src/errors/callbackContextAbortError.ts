import { CallbackAbortResponse } from '@/services/createCallbackContext'
import { BeforeCallbackContextError } from '@/errors/beforeCallbackContextError'

export class CallbackContextAbortError extends BeforeCallbackContextError {
  public constructor() {
    const response: CallbackAbortResponse = { status: 'ABORT' }

    super('Uncaught CallbackContextAbortError', response)
  }
}
