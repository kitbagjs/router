import { RegisteredRouterPush } from "@/types/register"
import { CallbackContextError } from "./callbackContextError"
import { CallbackPushResponse } from "@/services/createCallbackContext"

export class RouterPushError extends CallbackContextError {
  public response: CallbackPushResponse

  public constructor(to: unknown[]) {
    super('Error occurred during a router push operation.')

    this.response = { status: 'PUSH', to: to as Parameters<RegisteredRouterPush> }
  }

}
