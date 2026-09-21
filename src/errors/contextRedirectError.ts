import { CallbackContextRedirect } from '@/types/callbackContext'
import { ContextError } from './contextError'
import { RouterPush } from '@/types/routerPush'

export class ContextRedirectError extends ContextError {
  public response: CallbackContextRedirect

  public constructor(to: unknown[]) {
    super('Uncaught ContextRedirectError')

    this.response = { status: 'REDIRECT', to: to as Parameters<RouterPush> }
  }
}
