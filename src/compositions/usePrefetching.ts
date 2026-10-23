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
  take: () => RouterNavigationStore | undefined,
}

type UsePrefetchingFunction = (config: MaybeRefOrGetter<UsePrefetchingConfig>) => UsePrefetching

export function createUsePrefetching<TRouter extends Router>(routerKey: InjectionKey<TRouter>): UsePrefetchingFunction {
  const useRouterNavigation = createUseRouterNavigation(routerKey)

  return (config) => {
    const element = ref<HTMLElement>()

    const navigation = useRouterNavigation()
    let prefetch = navigation.create()
    let hasPrefetched = false
    const { isElementVisible } = useVisibilityObserver(element)

    const take: UsePrefetching['take'] = () => {
      const prepared = prefetch
      const prefetched = hasPrefetched
      prefetch = navigation.create()
      hasPrefetched = false

      if (!prefetched) {
        prepared.dispose()

        return
      }

      return prepared
    }

    onScopeDispose(() => prefetch.dispose())

    watch(() => toValue(config), ({ route, ...configs }, previous) => {
      if (!isSameResolvedRoute(route, previous?.route)) {
        prefetch.dispose()
        prefetch = navigation.create()
        hasPrefetched = false
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

      const values = prefetch.compute(route, computations)
      hasPrefetched = hasPrefetched || values.length > 0
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
