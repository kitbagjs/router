export type SsrContextStore = {
  setSsrContext: (ctx: Record<string, unknown> | undefined) => void,
  addSsrContext: (key: string, value: unknown) => void,
}

const DEFAULT_CONTEXT: Record<string, unknown> = {}

export function createSsrContextStore(): SsrContextStore {
  let context: Record<string, unknown> = DEFAULT_CONTEXT

  function setSsrContext(ctx: Record<string, unknown> | undefined): void {
    context = ctx ?? DEFAULT_CONTEXT
  }

  function addSsrContext(key: string, value: unknown): void {
    context[key] = value
  }

  return {
    setSsrContext,
    addSsrContext,
  }
}
