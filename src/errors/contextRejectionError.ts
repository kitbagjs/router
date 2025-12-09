import { RegisteredRejectionType } from '@/types/register'
import { CallbackRejectResponse } from '@/services/createCallbackContext'
import { ContextError } from './ContextError'

export class ContextRejectionError extends ContextError {
  public response: CallbackRejectResponse

  public constructor(type: RegisteredRejectionType) {
    super('Uncaught ContextRejectionError')

    this.response = { status: 'REJECT', type }
  }
}
