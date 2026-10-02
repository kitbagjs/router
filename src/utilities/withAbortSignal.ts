/**
 * Stops waiting when a navigation is canceled, even if a user callback never settles.
 */
export async function withAbortSignal<T>(work: Promise<T>, signal: AbortSignal): Promise<T> {
  if (signal.aborted) {
    work.catch(() => {})
    signal.throwIfAborted()
  }

  const listener = new AbortController()
  const aborted = new Promise<never>((_resolve, reject) => {
    function abort(): void {
      const reason: unknown = signal.reason

      reject(reason instanceof Error || reason instanceof DOMException ? reason : new DOMException('Navigation aborted', 'AbortError'))
    }

    signal.addEventListener('abort', abort, listener)
  })

  try {
    return await Promise.race([
      work,
      aborted,
    ])
  } finally {
    listener.abort()
  }
}
