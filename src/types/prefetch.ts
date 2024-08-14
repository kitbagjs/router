export type PrefetchConfigOptions = {
  /**
   * When true any component that is wrapped in vue's defineAsyncComponent will be prefetched
   * @default true
   */
  components?: boolean,
}

/**
 * Determines what assets are prefetched. A boolean enables or disables all prefetching.
 */
export type PrefetchConfig = boolean | PrefetchConfigOptions

export const DEFAULT_PREFETCH_CONFIG: PrefetchConfigOptions = {
  components: true,
}