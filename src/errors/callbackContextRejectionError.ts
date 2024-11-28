import { RegisteredRejectionType } from '@/types/register'
import { CallbackRejectResponse } from '@/services/createCallbackContext'
import { AfterCallbackContextError } from '@/errors/afterCallbackContextError'

export class CallbackContextRejectionError extends AfterCallbackContextError {
  public constructor(type: RegisteredRejectionType) {
    const response: CallbackRejectResponse = { status: 'REJECT', type }

    super('Uncaught CallbackContextRejectionError', response)
  }
}
