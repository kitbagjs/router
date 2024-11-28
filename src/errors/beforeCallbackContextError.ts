import { BeforeCallbackResponse } from '@/services/createCallbackContext'

export class BeforeCallbackContextError extends Error {
  public response: BeforeCallbackResponse

  public constructor(message: string, response: BeforeCallbackResponse) {
    super(message)

    this.response = response
  }
}
