import { CallbackContextError, CallbackContextPush, CallbackContextReject, CallbackContextSuccess } from './callbackContext'

export type ComputationResponse = CallbackContextSuccess | CallbackContextPush | CallbackContextReject | CallbackContextError
