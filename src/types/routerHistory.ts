import { Location } from '@/services/history'

export type NavigationPushOptions = {
  replace?: boolean,
  state?: unknown,
}

/**
 * A destination approved by the router. History checks its signal before writing the entry, then
 * commits the route. Native interception also waits for rendering before releasing scroll/focus.
 */
export type PreparedNavigation = {
  signal: AbortSignal,
  commit: (options?: { waitForRender?: boolean }) => Promise<void>,
}

/** A redirect decision. The history implementation applies it before preparing the destination. */
export type NavigationRedirect = {
  redirect: string,
  options: NavigationPushOptions,
}

export type NavigationContext = {
  signal?: AbortSignal,
}

export type NavigationPreparation = PreparedNavigation | NavigationRedirect | undefined

export type NavigationPrepare = (url: string, options: NavigationPushOptions, context: NavigationContext) => Promise<NavigationPreparation>

export type RouterHistory = {
  readonly location: Location,
  push: (url: string, options?: NavigationPushOptions) => Promise<void>,
  initialize: (url: string, options?: NavigationPushOptions) => Promise<void>,
  adopt: (url: string, options?: NavigationPushOptions) => void,
  refresh: () => void,
  back: () => void,
  forward: () => void,
  go: (delta: number) => void,
  startListening: () => void,
  stopListening: () => void,
}

export type RouterHistoryMode = 'auto' | 'browser' | 'memory' | 'hash'
