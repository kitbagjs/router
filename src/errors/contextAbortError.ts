import { CallbackContextAbort } from '@/types/callbackContext'
import { ContextError } from './contextError'

export class ContextAbortError extends ContextError {
  public response: CallbackContextAbort

  public constructor() {
    super('Uncaught ContextAbortError')

    this.response = { status: 'ABORT' }
  }
}
