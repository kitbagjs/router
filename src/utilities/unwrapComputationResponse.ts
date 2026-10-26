import { NavigationAbandonedError } from '@/errors/navigationAbandonedError'
import { CallbackContextResponse } from '@/types/callbackContext'

export function unwrapComputationResponse(response: CallbackContextResponse): unknown {
  switch (response.status) {
    case 'SUCCESS':
      return response.value
    case 'ERROR':
      throw response.error
    case 'PUSH':
    case 'REJECT':
      throw new NavigationAbandonedError()
    default: {
      const exhaustive: never = response
      throw new Error(`Switch is not exhaustive for computation response: ${JSON.stringify(exhaustive)}`)
    }
  }
}
