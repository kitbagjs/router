import { RedirectStatus } from './router'
import { RouterPush } from './routerPush'

export type CallbackContextSuccess = {
  status: 'SUCCESS',
}

export type CallbackContextPush = {
  status: 'PUSH',
  to: Parameters<RouterPush>,
}

export type CallbackContextRedirect = {
  status: 'REDIRECT',
  to: Parameters<RouterPush>,
  /**
   * The status the redirect declared, or undefined to use the router's `redirectStatus`.
   */
  redirectStatus: RedirectStatus | undefined,
}

export type CallbackContextReject = {
  status: 'REJECT',
  type: string,
}

export type CallbackContextAbort = {
  status: 'ABORT',
}
