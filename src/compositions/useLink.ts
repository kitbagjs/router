import { ComputedRef, MaybeRefOrGetter, computed, toRef, toValue, watch } from 'vue'
import { usePropStore } from '@/compositions/usePropStore'
import { useRouter } from '@/compositions/useRouter'
import { InvalidRouteParamValueError } from '@/errors/invalidRouteParamValueError'
import { RouterResolveOptions } from '@/services/createRouterResolve'
import { isWithComponent, isWithComponents } from '@/types/createRouteOptions'
import { PrefetchConfig, PrefetchConfigs, getPrefetchOption } from '@/types/prefetch'
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
  const sourceRef = toRef(source)
  const paramsRef = computed<Record<PropertyKey, unknown>>(() => isUrl(sourceRef.value) ? {} : toValue(paramsOrOptions))
  const optionsRef = computed<UseLinkOptions>(() => isUrl(sourceRef.value) ? toValue(paramsOrOptions) : toValue(maybeOptions))
  const { getPrefetchProps, setPrefetchProps } = usePropStore()

  let props: Record<string, unknown> = {}

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
  const isExternal = computed(() => router.isExternal(href.value))

  const push: UseLink['push'] = (options) => {
    setPrefetchProps(props)

    return router.push(href.value, { ...optionsRef.value, ...options })
  }

  const replace: UseLink['replace'] = (options) => {
    return push(options)
  }

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

    props = getPrefetchProps(route, {
      routerPrefetch,
      linkPrefetch,
    })
  }, { immediate: true })

  return {
    route,
    href,
    isMatch,
    isExactMatch,
    isExternal,
    push,
    replace,
  }
}

function prefetchComponentsForRoute(route: ResolvedRoute, { routerPrefetch, linkPrefetch }: PrefetchConfigs): void {

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