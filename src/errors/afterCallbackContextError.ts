import { AfterCallbackResponse } from '@/services/createCallbackContext'
import { BeforeCallbackContextError } from '@/errors/beforeCallbackContextError'

export class AfterCallbackContextError extends BeforeCallbackContextError {
  public response: AfterCallbackResponse

  public constructor(message: string, response: AfterCallbackResponse) {
    super(message, response)

    this.response = response
  }
}
