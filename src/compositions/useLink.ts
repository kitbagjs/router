import { InjectionKey, MaybeRefOrGetter, computed, toValue } from 'vue'
import { createUsePrefetching } from '@/compositions/usePrefetching'
import { createUseRouter } from '@/compositions/useRouter'
import { ResolvedRoute } from '@/types/resolved'
import { RouterPushOptions } from '@/types/routerPush'
import { RouteParamsByKey } from '@/types/routeWithParams'
import { UrlString, isUrlString } from '@/types/urlString'
import { AllPropertiesAreOptional } from '@/types/utilities'
import { createIsRoute } from '@/guards/routes'
import { combineUrlSearchParams } from '@/utilities/urlSearchParams'
import { isDefined } from '@/utilities/guards'
import { Router, RouterRouteName, RouterRoutes } from '@/types/router'
import { UseLink, UseLinkOptions } from '@/types/useLink'

type UseLinkArgs<
  TRouter extends Router,
  TSource extends RouterRouteName<TRouter>,
  TParams = RouteParamsByKey<RouterRoutes<TRouter>, TSource>
> = AllPropertiesAreOptional<TParams> extends true
  ? [params?: MaybeRefOrGetter<TParams>, options?: MaybeRefOrGetter<UseLinkOptions>]
  : [params: MaybeRefOrGetter<TParams>, options?: MaybeRefOrGetter<UseLinkOptions>]

type UseLinkFunction<TRouter extends Router> = {
  <TRouteKey extends RouterRouteName<TRouter>>(name: MaybeRefOrGetter<TRouteKey>, ...args: UseLinkArgs<TRouter, TRouteKey>): UseLink,
  (url: MaybeRefOrGetter<UrlString>, options?: MaybeRefOrGetter<UseLinkOptions>): UseLink,
  (resolvedRoute: MaybeRefOrGetter<ResolvedRoute | undefined>, options?: MaybeRefOrGetter<UseLinkOptions>): UseLink,
  (source: MaybeRefOrGetter<string | ResolvedRoute | undefined>, paramsOrOptions?: MaybeRefOrGetter<Record<PropertyKey, unknown> | UseLinkOptions>, maybeOptions?: MaybeRefOrGetter<UseLinkOptions>): UseLink,
}

export function createUseLink<TRouter extends Router>(routerKey: InjectionKey<TRouter>): UseLinkFunction<TRouter> {
  const useRouter = createUseRouter(routerKey)
  const usePrefetching = createUsePrefetching(routerKey)
  const isRoute = createIsRoute(routerKey)

  return (
    source: MaybeRefOrGetter<string | ResolvedRoute | undefined>,
    paramsOrOptions: MaybeRefOrGetter<Record<PropertyKey, unknown> | UseLinkOptions> = {},
    maybeOptions: MaybeRefOrGetter<UseLinkOptions> = {},
  ) => {
    const router = useRouter()

    const route = computed(() => {
      const sourceValue = toValue(source)
      if (typeof sourceValue !== 'string') {
        return sourceValue
      }

      if (isUrlString(sourceValue)) {
        return router.find(sourceValue, toValue(maybeOptions))
      }

      return router.resolve(sourceValue, toValue(paramsOrOptions), toValue(maybeOptions))
    })

    const href = computed(() => {
      if (route.value) {
        return route.value.href
      }

      const sourceValue = toValue(source)
      if (isUrlString(sourceValue)) {
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

      return typeof sourceValue !== 'string' || isUrlString(sourceValue) ? toValue(paramsOrOptions) : toValue(maybeOptions)
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
      if (isUrlString(sourceValue) || typeof sourceValue === 'object') {
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
}
