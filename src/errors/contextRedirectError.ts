import { CallbackContextRedirect } from '@/types/callbackContext'
import { ContextError } from './contextError'
import { RedirectStatus } from '@/types/router'
import { Route } from '@/types/route'

export class ContextRedirectError extends ContextError {
  public response: CallbackContextRedirect

  public constructor(to: Route, params: Record<string, unknown> | undefined, redirectStatus: RedirectStatus | undefined) {
    super('Uncaught ContextRedirectError')

    this.response = { status: 'REDIRECT', to, params, redirectStatus }
  }
}
