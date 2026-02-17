export type SsrContextStore = {
  setSsrContext: (context: Record<string, unknown> | undefined) => void,
  addSsrContext: (key: string, value: unknown) => void,
}

const DEFAULT_CONTEXT: Record<string, unknown> = {}

export function createSsrContextStore(): SsrContextStore {
  let ssrContext: Record<string, unknown> = DEFAULT_CONTEXT

  function setSsrContext(context: Record<string, unknown> | undefined): void {
    ssrContext = context ?? DEFAULT_CONTEXT
  }

  function addSsrContext(key: string, value: unknown): void {
    ssrContext[key] = value
  }

  return {
    setSsrContext,
    addSsrContext,
  }
}
