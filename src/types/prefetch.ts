/**
 * Determines when assets are prefetched.
 * eager: Fetched immediately
 * lazy: Fetched when visible
 */
export type PrefetchStrategy = 'eager' | 'lazy' | 'intent'

export type PrefetchConfigOptions = {
  /**
   * When true any component that is wrapped in vue's defineAsyncComponent will be prefetched
   * @default 'eager'
   */
  components?: boolean | PrefetchStrategy,
  /**
   * When true any props for routes will be prefetched
   * @default false
   */
  props?: boolean | PrefetchStrategy,
}

/**
 * Determines what assets are prefetched. A boolean enables or disables all prefetching.
 */
export type PrefetchConfig = boolean | PrefetchStrategy | PrefetchConfigOptions

export type PrefetchConfigs = {
  routerPrefetch?: PrefetchConfig,
  routePrefetch?: PrefetchConfig,
  linkPrefetch?: PrefetchConfig,
}
