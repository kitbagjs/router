import { CallbackAbortResponse } from "@/services/createCallbackContext";
import { CallbackContextError } from "./callbackContextError";

export class CallbackContextAbortError extends CallbackContextError {
  public response: CallbackAbortResponse

  public constructor() {
    super('Uncaught CallbackContextAbortError')

    this.response = { status: 'ABORT' }
  }
  
}
