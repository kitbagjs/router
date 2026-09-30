import { InjectionKey, MaybeRefOrGetter, onScopeDispose, ref, Ref, toValue, watch } from 'vue'
import { createUseRouteValueStore } from '@/compositions/useRouteValueStore'
import type { PrefetchConfigs, PrefetchStrategy } from '@/types/prefetch'
import { getPrefetchOption } from '@/utilities/prefetch'
import { ResolvedRoute } from '@/types/resolved'
import { loadAsyncComponents } from '@/utilities/components'
import { useVisibilityObserver } from './useVisibilityObserver'
import { useEventListener } from './useEventListener'
import { Router } from '@/types/router'
import { ComputationFilter } from '@/services/getComputations'

type UsePrefetchingConfig = PrefetchConfigs & {
  route: ResolvedRoute | undefined,
}

type UsePrefetching = {
  element: Ref<HTMLElement | undefined>,
  commit: () => void,
}

type UsePrefetchingFunction = (config: MaybeRefOrGetter<UsePrefetchingConfig>) => UsePrefetching

export function createUsePrefetching<TRouter extends Router>(routerKey: InjectionKey<TRouter>): UsePrefetchingFunction {
  const useRouteValueStore = createUseRouteValueStore(routerKey)

  return (config) => {
    const element = ref<HTMLElement>()

    const { createDetachedStore } = useRouteValueStore()
    const store = createDetachedStore()
    const { isElementVisible } = useVisibilityObserver(element)

    const commit: UsePrefetching['commit'] = () => {
      store.stage()
    }

    onScopeDispose(() => store.dispose())

    watch(() => toValue(config), ({ route, ...configs }) => {
      store.reset()

      if (!route) {
        return
      }

      doPrefetchingForStrategy('eager', route, configs)
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
      store.compute(route, isComputationForStrategy(strategy, configs))
    }

    return {
      element,
      commit,
    }
  }
}

function isComputationForStrategy(strategy: PrefetchStrategy, configs: PrefetchConfigs): ComputationFilter {
  return (computation) => getPrefetchOption({
    ...configs,
    routePrefetch: computation.routePrefetch,
    viewPrefetch: computation.prefetch,
  }, computation.kind === 'loader' ? 'loaders' : 'props') === strategy
}

function prefetchComponentsForRoute(strategy: PrefetchStrategy, route: ResolvedRoute, configs: PrefetchConfigs): void {
  loadAsyncComponents(route, (match, view) => getPrefetchOption({
    ...configs,
    routePrefetch: match.prefetch,
    viewPrefetch: view.prefetch,
  }, 'components') === strategy)
}
