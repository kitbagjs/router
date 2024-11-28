import { CallbackAbortResponse } from "@/services/createCallbackContext";
import { CallbackContextError } from "./callbackContextError";

export class NavigationAbortError extends CallbackContextError {
  public response: CallbackAbortResponse

  public constructor() {
    super('Error occurred during a navigation abort operation.')

    this.response = { status: 'ABORT' }
  }
  
}
