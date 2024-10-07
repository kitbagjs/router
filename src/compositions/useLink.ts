import { MaybeRefOrGetter, Ref, computed, toRef, toValue, watch } from 'vue'
import { usePropStore } from '@/compositions/usePropStore'
import { useRouter } from '@/compositions/useRouter'
import { InvalidRouteParamValueError } from '@/errors/invalidRouteParamValueError'
import { PropStore, RouteProps } from '@/services/createPropStore'
import { RouterResolveOptions } from '@/services/createRouterResolve'
import { isWithComponent, isWithComponents } from '@/types/createRouteOptions'
import { PrefetchConfig, getPrefetchOption } from '@/types/prefetch'
import { RegisteredRoutes, RegisteredRoutesName } from '@/types/register'
import { ResolvedRoute } from '@/types/resolved'
import { RouterPushOptions } from '@/types/routerPush'
import { RouterReplaceOptions } from '@/types/routerReplace'
import { RouteParamsByKey } from '@/types/routeWithParams'
import { Url, isUrl } from '@/types/url'
import { AllPropertiesAreOptional } from '@/types/utilities'
import { isAsyncComponent } from '@/utilities/components'

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
 * @param source - The name of the route or the URL value.
 * @param params - If providing route name, this argument will expect corresponding params.
 * @param options - {@link RouterResolveOptions}Same options as router resolve.
 * @returns {UseLink} Reactive context values for as well as navigation methods.
 *
 */
export function useLink<TRouteKey extends RegisteredRoutesName>(name: MaybeRefOrGetter<TRouteKey>, ...args: UseLinkArgs<TRouteKey>): UseLink
export function useLink(url: MaybeRefOrGetter<Url>, options?: MaybeRefOrGetter<UseLinkOptions>): UseLink
export function useLink(
  source: MaybeRefOrGetter<string>,
  paramsOrOptions: MaybeRefOrGetter<Record<PropertyKey, unknown> | UseLinkOptions> = {},
  maybeOptions: MaybeRefOrGetter<UseLinkOptions> = {},
): UseLink {
  const router = useRouter()
  const { getRouteProps, setRouteProps } = usePropStore()
  const sourceRef = toRef(source)
  const paramsRef = computed<Record<PropertyKey, unknown>>(() => isUrl(sourceRef.value) ? {} : toValue(paramsOrOptions))
  const optionsRef = computed<UseLinkOptions>(() => isUrl(sourceRef.value) ? toValue(paramsOrOptions) : toValue(maybeOptions))

  /**
   * Props prefetched for this specific link
   */
  let props: RouteProps | null = null

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

  const route = computed(() => router.find(href.value, optionsRef.value))
  const isMatch = computed(() => !!route.value && router.route.matches.includes(route.value.matched))
  const isExactMatch = computed(() => !!route.value && router.route.matched === route.value.matched)

  watch(route, route => {
    if (!route) {
      return
    }

    const { prefetch: routerPrefetch } = router
    const { prefetch: linkPrefetch } = optionsRef.value

    prefetchComponentsForRoute(route, {
      routerPrefetch,
      linkPrefetch,
    })

    props = prefetchPropsForRoute(route, {
      getRouteProps,
      routerPrefetch,
      linkPrefetch,
    })
  }, { immediate: true })

  const push: UseLink['push'] = (options) => {
    if (props) {
      setRouteProps(props, { prefetched: true })
    }

    return router.push(href.value, {}, options)
  }

  const replace: UseLink['replace'] = (options) => {
    return push({ ...options, replace: true })
  }

  return {
    route,
    href,
    isMatch,
    isExactMatch,
    push,
    replace,
  }
}

type ComponentPrefetchContext = {
  routerPrefetch: PrefetchConfig | undefined,
  linkPrefetch: PrefetchConfig | undefined,
}

function prefetchComponentsForRoute(route: ResolvedRoute, { routerPrefetch, linkPrefetch }: ComponentPrefetchContext): void {

  route.matches.forEach(route => {
    const shouldPrefetchComponents = getPrefetchOption({
      routePrefetch: route.prefetch,
      routerPrefetch,
      linkPrefetch,
    }, 'components')

    if (!shouldPrefetchComponents) {
      return
    }

    if (isWithComponent(route) && isAsyncComponent(route.component)) {
      route.component.setup()
    }

    if (isWithComponents(route)) {
      Object.values(route.components).forEach(component => {
        if (isAsyncComponent(component)) {
          component.setup()
        }
      })
    }
  })

}

type PropsPrefetchContext = {
  routerPrefetch: PrefetchConfig | undefined,
  linkPrefetch: PrefetchConfig | undefined,
  getRouteProps: PropStore['getRouteProps'],
}

function prefetchPropsForRoute(route: ResolvedRoute, { getRouteProps, routerPrefetch, linkPrefetch }: PropsPrefetchContext): RouteProps | null {

  // filter down the route's matches to just the matches that should be prefetched
  const matches = route.matches.filter((match) => getPrefetchOption({
    routePrefetch: match.prefetch,
    routerPrefetch,
    linkPrefetch,
  }, 'props'))

  if (!matches.length) {
    return null
  }

  return getRouteProps({
    ...route,
    matches,
  })
}