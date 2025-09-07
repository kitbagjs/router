import { PrefetchConfig, PrefetchConfigOptions, PrefetchConfigs, PrefetchStrategy } from '@/types/prefetch'
import { isRecord } from './guards'

export const DEFAULT_PREFETCH_STRATEGY: PrefetchStrategy = 'lazy'

const DEFAULT_PREFETCH_CONFIG: Required<PrefetchConfigOptions> = {
  components: true,
  props: false,
}

function isPrefetchStrategy(value: any): value is PrefetchStrategy {
  return ['eager', 'lazy', 'intent'].includes(value)
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
