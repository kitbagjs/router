import { RegisteredRouterPush } from "@/types/register"
import { CallbackPushResponse } from "@/services/createCallbackContext"

export class CallbackContextPushError extends Error {
  public response: CallbackPushResponse

  public constructor(to: unknown[]) {
    super('Uncaught CallbackContextPushError')

    this.response = { status: 'PUSH', to: to as Parameters<RegisteredRouterPush> }
  }

}
