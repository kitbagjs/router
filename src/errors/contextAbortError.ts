import { RouterCallbackAbortResponse } from '@/services/createRouterCallbackContext'
import { ContextError } from './contextError'

export class ContextAbortError extends ContextError {
  public response: RouterCallbackAbortResponse

  public constructor() {
    super('Uncaught ContextAbortError')

    this.response = { status: 'ABORT' }
  }
}
