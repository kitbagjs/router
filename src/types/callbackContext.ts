import { RouterPush } from './routerPush'

export type CallbackContextSuccess = {
  status: 'SUCCESS',
}

export type CallbackContextPush = {
  status: 'PUSH',
  to: Parameters<RouterPush>,
}

export type CallbackContextReject = {
  status: 'REJECT',
  type: string,
}

export type CallbackContextAbort = {
  status: 'ABORT',
}
