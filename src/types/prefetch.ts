import { isRecord } from '@/utilities'

export const DEFAULT_PREFETCH_STRATEGY: PrefetchStrategy = 'lazy'

const DEFAULT_PREFETCH_CONFIG: Required<PrefetchConfigOptions> = {
  components: DEFAULT_PREFETCH_STRATEGY,
  props: false,
}

/**
 * Determines when assets are prefetched.
 * eager: Fetched immediately
 * lazy: Fetched when visible
 * intent: Fetched when user focuses or hovers
 */
export type PrefetchStrategy = 'eager' | 'lazy' | 'intent'

function isPrefetchStrategy(value: any): value is PrefetchStrategy {
  return ['eager', 'lazy', 'intent'].includes(value)
}

export type PrefetchConfigOptions = {
  /**
   * When true any component that is wrapped in vue's defineAsyncComponent will be prefetched
   * @default 'lazy'
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

export function getPrefetchOption({ routerPrefetch, routePrefetch, linkPrefetch }: PrefetchConfigs, setting: keyof PrefetchConfigOptions): false | PrefetchStrategy {
  const link = getPrefetchConfigValue(linkPrefetch, setting)
  const route = getPrefetchConfigValue(routePrefetch, setting)
  const router = getPrefetchConfigValue(routerPrefetch, setting)

  const value = [
    link,
    route,
    router,
    DEFAULT_PREFETCH_CONFIG[setting],
    DEFAULT_PREFETCH_STRATEGY,
  ].reduce((previous, next) => {
    if (isPrefetchStrategy(previous)) {
      return previous
    }

    if (previous === true && isPrefetchStrategy(next)) {
      return next
    }

    if (previous === true && !isPrefetchStrategy(next)) {
      return previous
    }

    if (previous === undefined) {
      return next
    }

    return previous
  }, undefined)

  if (isPrefetchStrategy(value)) {
    return value
  }

  return false
}

export function getPrefetchConfigValue(prefetch: PrefetchConfig | undefined, setting: keyof PrefetchConfigOptions): boolean | PrefetchStrategy | undefined {
  if (isRecord(prefetch)) {
    return prefetch[setting]
  }

  return prefetch
}
