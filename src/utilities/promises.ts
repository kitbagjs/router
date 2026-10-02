export function isPromise(value: unknown): value is Promise<unknown> {
  return typeof value === 'object' && value !== null && 'then' in value
}

/**
 * Resolves when the signal aborts, including an already aborted signal. A caller can supply a listener
 * controller to stop watching when other work finishes first; stopping the listener does not settle
 * the promise or abort the watched signal.
 */
export function createAbortPromise(signal: AbortSignal, listener = new AbortController()): Promise<void> {
  if (signal.aborted) {
    return Promise.resolve()
  }

  return new Promise((resolve) => {
    signal.addEventListener('abort', () => {
      resolve()
      listener.abort()
    }, listener)
  })
}
