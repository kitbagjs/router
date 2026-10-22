import { InjectionKey, MaybeRefOrGetter, onScopeDispose, ref, Ref, toValue, watch } from 'vue'
import { createUseRouterNavigation } from '@/compositions/useRouterNavigation'
import type { PrefetchConfigs, PrefetchStrategy } from '@/types/prefetch'
import { getPrefetchOption } from '@/utilities/prefetch'
import { ResolvedRoute } from '@/types/resolved'
import { loadAsyncComponents } from '@/utilities/components'
import { useVisibilityObserver } from './useVisibilityObserver'
import { useEventListener } from './useEventListener'
import { Router } from '@/types/router'
import { getComputationsForStrategy } from '@/services/getComputations'
import { RouterNavigationStore } from '@/services/createRouterNavigation'
import { isSameResolvedRoute } from '@/utilities/isSameResolvedRoute'

type UsePrefetchingConfig = PrefetchConfigs & {
  route: ResolvedRoute | undefined,
}

type UsePrefetching = {
  element: Ref<HTMLElement | undefined>,
  take: (route: ResolvedRoute | undefined) => RouterNavigationStore,
}

type UsePrefetchingFunction = (config: MaybeRefOrGetter<UsePrefetchingConfig>) => UsePrefetching

export function createUsePrefetching<TRouter extends Router>(routerKey: InjectionKey<TRouter>): UsePrefetchingFunction {
  const useRouterNavigation = createUseRouterNavigation(routerKey)

  return (config) => {
    const element = ref<HTMLElement>()

    const navigation = useRouterNavigation()
    let prefetch = navigation.create()
    const { isElementVisible } = useVisibilityObserver(element)

    const take: UsePrefetching['take'] = (route) => {
      const prepared = prefetch
      const { route: prefetchedRoute } = toValue(config)
      prefetch = navigation.create()

      if (!isSameResolvedRoute(route, prefetchedRoute)) {
        prepared.dispose()

        return navigation.create()
      }

      return prepared
    }

    onScopeDispose(() => prefetch.dispose())

    watch(() => toValue(config), ({ route, ...configs }, previous) => {
      if (!isSameResolvedRoute(route, previous?.route)) {
        prefetch.dispose()
        prefetch = navigation.create()
      }

      if (!route) {
        return
      }

      doPrefetchingForStrategy('eager', route, configs)

      if (isElementVisible.value) {
        doPrefetchingForStrategy('lazy', route, configs)
      }
    }, { immediate: true })

    watch(isElementVisible, (isVisible) => {
      const { route, ...configs } = toValue(config)

      if (!route || !isVisible) {
        return
      }

      doPrefetchingForStrategy('lazy', route, configs)
    }, { immediate: true })

    useEventListener(element, 'focusin', handleIntentEvent)
    useEventListener(element, 'mouseover', handleIntentEvent)

    function handleIntentEvent(): void {
      const { route, ...configs } = toValue(config)

      if (!route) {
        return
      }

      doPrefetchingForStrategy('intent', route, configs)
    }

    function doPrefetchingForStrategy(strategy: PrefetchStrategy, route: ResolvedRoute, configs: PrefetchConfigs): void {
      prefetchComponentsForRoute(strategy, route, configs)
      const computations = getComputationsForStrategy(route, strategy, configs)

      prefetch.compute(route, computations)
    }

    return {
      element,
      take,
    }
  }
}

function prefetchComponentsForRoute(strategy: PrefetchStrategy, route: ResolvedRoute, configs: PrefetchConfigs): void {
  loadAsyncComponents(route, (match, view) => getPrefetchOption({
    ...configs,
    routePrefetch: match.prefetch,
    viewPrefetch: view.prefetch,
  }, 'components') === strategy)
}
