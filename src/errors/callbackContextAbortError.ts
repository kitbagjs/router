import { CallbackAbortResponse } from '@/services/createCallbackContext'

export class CallbackContextAbortError extends Error {
  public response: CallbackAbortResponse

  public constructor() {
    super('Uncaught CallbackContextAbortError')

    this.response = { status: 'ABORT' }
  }
}
