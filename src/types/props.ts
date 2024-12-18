import { CallbackContext } from '@/services/createCallbackContext'

/**
 * Context provided to props callback functions
 */
export type PropsCallbackContext = {
  push: CallbackContext['push'],
  replace: CallbackContext['replace'],
  reject: CallbackContext['reject'],
}
