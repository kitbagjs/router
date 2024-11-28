import { RegisteredRejectionType } from '@/types/register'
import { CallbackContextError } from './callbackContextError'
import { CallbackRejectResponse } from '@/services/createCallbackContext'

export class CallbackContextRejectionError extends CallbackContextError {
  public response: CallbackRejectResponse

  public constructor(type: RegisteredRejectionType) {
    super('Uncaught CallbackContextRejectionError')

    this.response = { status: 'REJECT', type }
  }
  
}
