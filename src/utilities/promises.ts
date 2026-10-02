export function isPromise(value: unknown): value is Promise<unknown> {
  return typeof value === 'object' && value !== null && 'then' in value
}

/**
 * Resolves when the signal aborts, including an already aborted signal.
 */
export function createAbortPromise(signal: AbortSignal): Promise<void> {
  if (signal.aborted) {
    return Promise.resolve()
  }

  return new Promise((resolve) => {
    signal.addEventListener('abort', () => {
      resolve()
    })
  })
}
