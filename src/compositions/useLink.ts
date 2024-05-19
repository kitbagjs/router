import { MaybeRefOrGetter, Ref, computed, readonly, toValue } from 'vue'
import { useRouter } from '@/compositions/useRouter'
import { InvalidRouteParamValueError } from '@/errors/invalidRouteParamValueError'
import { RouterResolveOptions } from '@/services/createRouterResolve'
import { RegisteredRouteMap, RegisteredRoutes } from '@/types/register'
import { ResolvedRoute } from '@/types/resolved'
import { RouterPushOptions } from '@/types/routerPush'
import { RouterReplaceOptions } from '@/types/routerReplace'
import { RouteParamsByKey } from '@/types/routeWithParams'
import { Url, isUrl } from '@/types/url'
import { AllPropertiesAreOptional } from '@/types/utilities'

export type UseLink = {
  /**
   * ResolvedRoute if matched. Same value as `router.find`
   */
  route: Ref<ResolvedRoute | undefined>,
  /**
   * Resolved URL with params interpolated and query applied. Same value as `router.resolve`.
   */
  href: Ref<string>,
  /**
   * True if route matches current URL or is ancestor of route that matches current URL
   */
  isMatch: Ref<boolean>,
  /**
   * True if route matches current URL. Route is the same as what's currently stored at `router.route`.
   */
  isExactMatch: Ref<boolean>,
  /**
   * Convenience method for executing `router.push` with route context passed in.
   */
  push: (options?: RouterPushOptions) => Promise<void>,
  /**
   * Convenience method for executing `router.replace` with route context passed in.
   */
  replace: (options?: RouterReplaceOptions) => Promise<void>,
}

type UseLinkArgs<
  TSource extends string & keyof RegisteredRouteMap,
  TParams = RouteParamsByKey<RegisteredRoutes, TSource>
> = AllPropertiesAreOptional<TParams> extends true
  ? [params?: MaybeRefOrGetter<TParams>, options?: MaybeRefOrGetter<RouterResolveOptions>]
  : [params: MaybeRefOrGetter<TParams>, options?: MaybeRefOrGetter<RouterResolveOptions>]

/**
 * A composition to export much of the functionality that drives RouterLink component. Can be given route details to discover resolved URL,
 * or resolved URL to discover route details. Also exports some useful context about routes relationship to current URL and convenience methods
 * for navigating.
 *
 * @param source - The key of the route or the URL value.
 * @param params - If providing route key, this argument will expect corresponding params.
 * @param options - {@link RouterResolveOptions}Same options as router resolve.
 * @returns {UseLink} Reactive context values for as well as navigation methods.
 *
 */
export function useLink<TRouteKey extends string & keyof RegisteredRouteMap>(routeKey: MaybeRefOrGetter<TRouteKey>, ...args: UseLinkArgs<TRouteKey>): UseLink
export function useLink(url: MaybeRefOrGetter<Url>): UseLink
export function useLink(
  source: MaybeRefOrGetter<string>,
  params: MaybeRefOrGetter<Record<PropertyKey, unknown>> = {},
  options: MaybeRefOrGetter<RouterResolveOptions> = {},
): UseLink {
  const router = useRouter()
  const sourceRef = computed(() => toValue(source))
  const paramsRef = computed(() => toValue(params))
  const optionsRef = computed(() => toValue(options))

  const href = computed(() => {
    if (isUrl(sourceRef.value)) {
      return sourceRef.value
    }

    try {
      return router.resolve(sourceRef.value, paramsRef.value, optionsRef.value)
    } catch (error) {
      if (error instanceof InvalidRouteParamValueError) {
        console.error(`Failed to resolve route "${sourceRef.value.toString()}" in RouterLink.`, error)
      }

      throw error
    }
  })

  const route = computed(() => {
    return router.find(href.value, optionsRef.value)
  })

  const isMatch = computed(() => !!route.value && router.route.matches.includes(readonly(route.value.matched)))
  const isExactMatch = computed(() => !!route.value && router.route.matched === route.value.matched)

  return {
    route,
    href,
    isMatch,
    isExactMatch,
    push: (options?: RouterPushOptions) => router.push(href.value, {}, { ...optionsRef.value, ...options }),
    replace: (options?: RouterReplaceOptions) => router.replace(href.value, {}, { ...optionsRef.value, ...options }),
  }
}