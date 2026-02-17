export type SsrContextStore = {
  setSsrContext: (ctx: Record<string, unknown> | undefined) => void,
  addSsrContext: (key: string, value: unknown) => void,
}

export function createSsrContextStore(): SsrContextStore {
  const emptyContext: Record<string, unknown> = {}
  let context: Record<string, unknown> = emptyContext

  function setSsrContext(ctx: Record<string, unknown> | undefined): void {
    context = ctx ?? emptyContext
  }

  function addSsrContext(key: string, value: unknown): void {
    context[key] = value
  }

  return {
    setSsrContext,
    addSsrContext,
  }
}
