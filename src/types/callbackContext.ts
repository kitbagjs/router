import { RouterPush } from './routerPush'
import { DataKind } from '@/services/getDataKey'

export type CallbackContextSuccess = {
  status: 'SUCCESS',
  value: unknown,
}

export type CallbackContextPush = {
  status: 'PUSH',
  to: Parameters<RouterPush>,
}

export type CallbackContextRedirect = {
  status: 'REDIRECT',
  to: Parameters<RouterPush>,
}

export type CallbackContextReject = {
  status: 'REJECT',
  type: string,
}

export type CallbackContextAbort = {
  status: 'ABORT',
}

export type CallbackContextError = {
  status: 'ERROR',
  error: unknown,
  source: DataKind,
}
