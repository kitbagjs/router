/** A canceled navigation is a settled router operation. Other failures still reach the caller. */
export async function ignoreNavigationAbort(work: Promise<unknown>): Promise<void> {
  try {
    await work
  } catch (error) {
    if (!(error instanceof DOMException && error.name === 'AbortError')) {
      throw error
    }
  }
}
