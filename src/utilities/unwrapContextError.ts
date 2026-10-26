import { ContextCallbackError } from '@/errors/contextCallbackError'

export function unwrapContextError(error: unknown): unknown {
  if (error instanceof ContextCallbackError) {
    return error.response.error
  }

  return error
}
