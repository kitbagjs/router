import { RegisteredRejectionType } from '@/types/register'
import { CallbackContextError } from './callbackContextError'
import { CallbackRejectResponse } from '@/services/createCallbackContext'

export class RouterRejectionError extends CallbackContextError {
  public response: CallbackRejectResponse

  public constructor(type: RegisteredRejectionType) {
    super('Error occurred during a router rejection operation.')

    this.response = { status: 'REJECT', type }
  }
  
}
