import { isRecord } from '@/utilities'

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

export const DEFAULT_PREFETCH_CONFIG: Required<PrefetchConfigOptions> = {
  components: true,
}

type PrefetchConfigs = {
  routerPrefetch: PrefetchConfig | undefined,
  routePrefetch: PrefetchConfig | undefined,
  linkPrefetch: PrefetchConfig | undefined,
}

export function getPrefetchOption({ routerPrefetch, routePrefetch, linkPrefetch }: PrefetchConfigs, setting: keyof PrefetchConfigOptions): boolean {
  return getPrefetchConfigValue(linkPrefetch, setting) ?? getPrefetchConfigValue(routePrefetch, setting) ?? getPrefetchConfigValue(routerPrefetch, setting) ?? DEFAULT_PREFETCH_CONFIG[setting]
}

export function getPrefetchConfigValue(prefetch: PrefetchConfig | undefined, setting: keyof PrefetchConfigOptions): boolean | undefined {
  if (isRecord(prefetch)) {
    return prefetch[setting]
  }

  return prefetch
}