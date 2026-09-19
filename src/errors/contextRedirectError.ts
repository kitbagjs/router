import { CallbackContextRedirect } from '@/types/callbackContext'
import { ContextError } from './contextError'
import { RedirectStatus } from '@/types/router'
import { RouterPush } from '@/types/routerPush'

export class ContextRedirectError extends ContextError {
  public response: CallbackContextRedirect

  public constructor(to: unknown[], redirectStatus: RedirectStatus | undefined) {
    super('Uncaught ContextRedirectError')

    this.response = { status: 'REDIRECT', to: to as Parameters<RouterPush>, redirectStatus }
  }
}
