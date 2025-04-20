import { ComputedRef, MaybeRefOrGetter, Ref, computed, toValue } from 'vue'
import { usePrefetching } from '@/compositions/usePrefetching'
import { useRouter } from '@/compositions/useRouter'
import { PrefetchConfig } from '@/types/prefetch'
import { RegisteredRoutes, RegisteredRoutesName } from '@/types/register'
import { ResolvedRoute } from '@/types/resolved'
import { RouterPushOptions } from '@/types/routerPush'
import { RouterReplaceOptions } from '@/types/routerReplace'
import { RouteParamsByKey } from '@/types/routeWithParams'
import { Url, isUrl } from '@/types/url'
import { AllPropertiesAreOptional } from '@/types/utilities'
import { isRoute } from '@/guards/routes'
import { combineUrlSearchParams } from '@/utilities/urlSearchParams'
import { isDefined } from '@/utilities/guards'

export type UseLink = {
  /**
   * A template ref to bind to the dom for automatic prefetching
   */
  element: Ref<HTMLElement | undefined>,
  /**
   * ResolvedRoute if matched. Same value as `router.find`
   */
  route: ComputedRef<ResolvedRoute | undefined>,
  /**
   * Resolved URL with params interpolated and query applied. Same value as `router.resolve`.
   */
  href: ComputedRef<Url | undefined>,
  /**
   * True if route matches current URL or is ancestor of route that matches current URL
   */
  isMatch: ComputedRef<boolean>,
  /**
   * True if route matches current URL. Route is the same as what's currently stored at `router.route`.
   */
  isExactMatch: ComputedRef<boolean>,
  /**
   * True if route matches current URL, or is a parent route that matches the parent of the current URL.
   */
  isActive: ComputedRef<boolean>,
  /**
   * True if route matches current URL exactly.
   */
  isExactActive: ComputedRef<boolean>,
  /**
   *
   */
  isExternal: ComputedRef<boolean>,
  /**
   * Convenience method for executing `router.push` with route context passed in.
   */
  push: (options?: RouterPushOptions) => Promise<void>,
  /**
   * Convenience method for executing `router.replace` with route context passed in.
   */
  replace: (options?: RouterReplaceOptions) => Promise<void>,
}

export type UseLinkOptions = RouterPushOptions & {
  prefetch?: PrefetchConfig,
}

type UseLinkArgs<
  TSource extends RegisteredRoutesName,
  TParams = RouteParamsByKey<RegisteredRoutes, TSource>
> = AllPropertiesAreOptional<TParams> extends true
  ? [params?: MaybeRefOrGetter<TParams>, options?: MaybeRefOrGetter<UseLinkOptions>]
  : [params: MaybeRefOrGetter<TParams>, options?: MaybeRefOrGetter<UseLinkOptions>]

/**
 * A composition to export much of the functionality that drives RouterLink component. Can be given route details to discover resolved URL,
 * or resolved URL to discover route details. Also exports some useful context about routes relationship to current URL and convenience methods
 * for navigating.
 *
 * @param source - The name of the route or a valid URL.
 * @param params - If providing route name, this argument will expect corresponding params.
 * @param options - {@link RouterResolveOptions} Same options as router resolve.
 * @returns {UseLink} Reactive context values for as well as navigation methods.
 * @group Compositions
 */
export function useLink<TRouteKey extends RegisteredRoutesName>(name: MaybeRefOrGetter<TRouteKey>, ...args: UseLinkArgs<TRouteKey>): UseLink
export function useLink(url: MaybeRefOrGetter<Url>, options?: MaybeRefOrGetter<UseLinkOptions>): UseLink
export function useLink(resolvedRoute: MaybeRefOrGetter<ResolvedRoute | undefined>, options?: MaybeRefOrGetter<UseLinkOptions>): UseLink
export function useLink(source: MaybeRefOrGetter<string | ResolvedRoute | undefined>, paramsOrOptions?: MaybeRefOrGetter<Record<PropertyKey, unknown> | UseLinkOptions>, maybeOptions?: MaybeRefOrGetter<UseLinkOptions>): UseLink
export function useLink(
  source: MaybeRefOrGetter<string | ResolvedRoute | undefined>,
  paramsOrOptions: MaybeRefOrGetter<Record<PropertyKey, unknown> | UseLinkOptions> = {},
  maybeOptions: MaybeRefOrGetter<UseLinkOptions> = {},
): UseLink {
  const router = useRouter()

  const route = computed(() => {
    const sourceValue = toValue(source)
    if (typeof sourceValue !== 'string') {
      return sourceValue
    }

    if (isUrl(sourceValue)) {
      return router.find(sourceValue, toValue(maybeOptions))
    }

    return router.resolve(sourceValue, toValue(paramsOrOptions), toValue(maybeOptions))
  })

  const href = computed(() => {
    if (route.value) {
      return route.value.href
    }

    const sourceValue = toValue(source)
    if (isUrl(sourceValue)) {
      return sourceValue
    }

    console.error(new Error('Failed to resolve route in RouterLink.'))

    return undefined
  })

  const isMatch = computed(() => isRoute(router.route) && router.route.matches.some((match) => match.id === route.value?.id))
  const isExactMatch = computed(() => router.route.id === route.value?.id)
  const isActive = computed(() => isRoute(router.route) && isDefined(route.value) && router.route.href.startsWith(route.value.href))
  const isExactActive = computed(() => router.route.href === route.value?.href)
  const isExternal = computed(() => !!href.value && router.isExternal(href.value))

  const linkOptions = computed<UseLinkOptions>(() => {
    const sourceValue = toValue(source)

    return typeof sourceValue !== 'string' || isUrl(sourceValue) ? toValue(paramsOrOptions) : toValue(maybeOptions)
  })

  const { element, commit } = usePrefetching(() => ({
    route: route.value,
    routerPrefetch: router.prefetch,
    linkPrefetch: linkOptions.value.prefetch,
  }))

  const push: UseLink['push'] = (pushOptions) => {
    commit()

    const options: RouterPushOptions = {
      replace: pushOptions?.replace ?? linkOptions.value.replace,
      query: combineUrlSearchParams(linkOptions.value.query, pushOptions?.query),
      hash: pushOptions?.hash ?? linkOptions.value.hash,
      state: { ...linkOptions.value.state, ...pushOptions?.state },
    }

    const sourceValue = toValue(source)
    if (isUrl(sourceValue) || typeof sourceValue === 'object') {
      return router.push(sourceValue, options)
    }

    return router.push(sourceValue, toValue(paramsOrOptions), options)
  }

  const replace: UseLink['replace'] = (options) => {
    return push({ ...options, replace: true })
  }

  return {
    element,
    route,
    href,
    isMatch,
    isExactMatch,
    isActive,
    isExactActive,
    isExternal,
    push,
    replace,
  }
}
