import { CallbackContextError } from '@/types/callbackContext'
import { DataKind } from '@/services/getDataKey'
import { ContextError } from './contextError'

export class ContextCallbackError extends ContextError {
  public response: CallbackContextError

  public constructor(error: unknown, source: DataKind) {
    super('Uncaught ContextCallbackError')

    this.response = { status: 'ERROR', error, source }
  }
}
