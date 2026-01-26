import { CallbackContextPush } from '@/types/callbackContext'
import { ContextError } from './contextError'
import { RouterPush } from '@/main'

export class ContextPushError extends ContextError {
  public response: CallbackContextPush

  public constructor(to: unknown[]) {
    super('Uncaught ContextPushError')

    this.response = { status: 'PUSH', to: to as Parameters<RouterPush> }
  }
}
