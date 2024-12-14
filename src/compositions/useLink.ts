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
import { RouterResolveOptions } from '@/types/RouterResolve'

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
  href: ComputedRef<string>,
  /**
   * True if route matches current URL or is ancestor of route that matches current URL
   */
  isMatch: ComputedRef<boolean>,
  /**
   * True if route matches current URL. Route is the same as what's currently stored at `router.route`.
   */
  isExactMatch: ComputedRef<boolean>,
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

export type UseLinkOptions = RouterResolveOptions & {
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
export function useLink(resolvedRoute: MaybeRefOrGetter<ResolvedRoute>, options?: MaybeRefOrGetter<UseLinkOptions>): UseLink
export function useLink(
  source: MaybeRefOrGetter<string | ResolvedRoute>,
  paramsOrOptions: MaybeRefOrGetter<Record<PropertyKey, unknown> | UseLinkOptions> = {},
  maybeOptions: MaybeRefOrGetter<UseLinkOptions> = {},
): UseLink {
  const router = useRouter()

  const route = computed(() => {
    const sourceValue = toValue(source)
    if (typeof sourceValue !== 'string') {
      return sourceValue
    }

    try {
      return router.resolve(sourceValue, toValue(paramsOrOptions), toValue(maybeOptions))
    } catch {
      throw new Error('Failed to resolve route in RouterLink.')
    }
  })

  const href = computed(() => {
    if (route.value) {
      return route.value.href
    }

    const sourceValue = toValue(source)
    if(isUrl(sourceValue)){
      return sourceValue
    }

    throw new Error('Failed to resolve route in RouterLink.')
  })
  
  const isMatch = computed(() => isRoute(router.route) && router.route.matches.some(match => match.id === route.value?.id))
  const isExactMatch = computed(() => router.route.id === route.value?.id)
  const isExternal = computed(() => router.isExternal(href.value))

  const linkOptions = computed<UseLinkOptions>(() => {
    const sourceValue = toValue(source)

    return typeof sourceValue !== 'string' || isUrl(sourceValue) ? toValue(paramsOrOptions) : toValue(maybeOptions)
  })

  const { element, commit } = usePrefetching(() => ({
    route: route.value,
    routerPrefetch: router.prefetch,
    linkPrefetch: linkOptions.value.prefetch,
  }))

  const push: UseLink['push'] = (options) => {
    commit()

    return router.push(href.value, { ...linkOptions.value, ...options })
  }

  const replace: UseLink['replace'] = (options) => {
    return push(options)
  }

  return {
    element,
    route,
    href,
    isMatch,
    isExactMatch,
    isExternal,
    push,
    replace,
  }
}
