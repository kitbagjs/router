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
   * When true route props will be prefetched
   * @default false
   */
  props?: boolean | PrefetchStrategy,
  /**
   * When true route loaders will be prefetched
   * @default false
   */
  loaders?: boolean | PrefetchStrategy,
}

/**
 * Determines what assets are prefetched. A boolean enables or disables all prefetching.
 */
export type PrefetchConfig = boolean | PrefetchStrategy | PrefetchConfigOptions

export type PrefetchConfigs = {
  routerPrefetch?: PrefetchConfig,
  routePrefetch?: PrefetchConfig,
  viewPrefetch?: PrefetchConfig,
  linkPrefetch?: PrefetchConfig,
}
