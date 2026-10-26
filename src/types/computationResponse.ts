import { CallbackContextError, CallbackContextPush, CallbackContextReject, CallbackContextSuccess } from './callbackContext'

export type ComputationResponse = (CallbackContextSuccess & {
  value: unknown,
}) | CallbackContextPush | CallbackContextReject | CallbackContextError
