import { ContextPushError } from '@/errors/contextPushError'
import { ContextRejectionError } from '@/errors/contextRejectionError'
import { CallbackContextResponse } from '@/types/callbackContext'

export function unwrapComputationResponse(response: CallbackContextResponse): unknown {
  switch (response.status) {
    case 'SUCCESS':
      return response.value
    case 'ERROR':
      throw response.error
    case 'PUSH':
      throw new ContextPushError(response.to)
    case 'REJECT':
      throw new ContextRejectionError(response.type)
    default: {
      const exhaustive: never = response
      throw new Error(`Switch is not exhaustive for computation response: ${JSON.stringify(exhaustive)}`)
    }
  }
}
