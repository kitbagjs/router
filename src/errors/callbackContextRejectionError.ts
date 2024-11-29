import { RegisteredRejectionType } from '@/types/register'
import { CallbackRejectResponse } from '@/services/createCallbackContext'

export class CallbackContextRejectionError extends Error {
  public response: CallbackRejectResponse

  public constructor(type: RegisteredRejectionType) {
    super('Uncaught CallbackContextRejectionError')

    this.response = { status: 'REJECT', type }
  }
}
