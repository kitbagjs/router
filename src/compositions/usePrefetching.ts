import { computed, InjectionKey, MaybeRefOrGetter, onScopeDispose, ref, Ref, toValue, watch } from 'vue'
import { createUseRouterNavigation } from '@/compositions/useRouterNavigation'
import type { PrefetchConfigs, PrefetchStrategy } from '@/types/prefetch'
import { getPrefetchOption } from '@/utilities/prefetch'
import { ResolvedRoute } from '@/types/resolved'
import { loadAsyncComponents } from '@/utilities/components'
import { useVisibilityObserver } from './useVisibilityObserver'
import { useEventListener } from './useEventListener'
import { Router } from '@/types/router'
import { getComputations, getComputationsForStrategy } from '@/services/getComputations'
import { RouterNavigationStore } from '@/services/createRouterNavigation'
import { getComputationPrefetchKey } from '@/services/getComputationPrefetchKey'
import { isSameResolvedRoute } from '@/utilities/isSameResolvedRoute'

type UsePrefetchingConfig = PrefetchConfigs & {
  route: ResolvedRoute | undefined,
}

type PrefetchDestination = Pick<ResolvedRoute, 'id' | 'href'> & {
  state: unknown[],
}

type UsePrefetching = {
  element: Ref<HTMLElement | undefined>,
  enabled: Ref<boolean>,
  take: () => RouterNavigationStore,
}

type UsePrefetchingFunction = (config: MaybeRefOrGetter<UsePrefetchingConfig>) => UsePrefetching

export function createUsePrefetching<TRouter extends Router>(routerKey: InjectionKey<TRouter>): UsePrefetchingFunction {
  const useRouterNavigation = createUseRouterNavigation(routerKey)

  return (config) => {
    const element = ref<HTMLElement>()

    const navigation = useRouterNavigation()
    let prefetch = navigation.create()
    const { isElementVisible } = useVisibilityObserver(element)

    const enabled = computed(() => {
      const { route, ...configs } = toValue(config)

      if (!route) {
        return false
      }

      return getComputations(route).some((computation) => getPrefetchOption({
        ...configs,
        routePrefetch: computation.routePrefetch,
        viewPrefetch: computation.prefetch,
      }, getComputationPrefetchKey(computation.kind)) !== false)
    })

    const take: UsePrefetching['take'] = () => {
      const prepared = prefetch
      prefetch = navigation.create()

      return prepared
    }

    onScopeDispose(() => prefetch.dispose())

    const destination = computed<PrefetchDestination | undefined>((previous) => {
      const { route } = toValue(config)

      if (!route) {
        return
      }

      const current = getPrefetchDestination(route)

      return isSamePrefetchDestination(current, previous) ? previous : current
    })

    watch(destination, () => {
      prefetch.dispose()
      prefetch = navigation.create()
      prefetchRoute()
    }, {
      immediate: true,
      deep: true,
      flush: 'sync',
    })

    watch(() => {
      const { route, ...configs } = toValue(config)

      return configs
    }, prefetchRoute, { deep: true })

    function prefetchRoute(): void {
      const { route, ...configs } = toValue(config)

      if (!route) {
        return
      }

      doPrefetchingForStrategy('eager', route, configs)

      if (isElementVisible.value) {
        doPrefetchingForStrategy('lazy', route, configs)
      }
    }

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
      enabled,
      take,
    }
  }
}

function getPrefetchDestination(route: ResolvedRoute): PrefetchDestination {
  const stateNames = route.matches.flatMap((match) => Object.keys(match.state ?? {}))

  return {
    id: route.id,
    href: route.href,
    state: stateNames.map((name) => route.state[name]),
  }
}

function isSamePrefetchDestination(current: PrefetchDestination, previous: PrefetchDestination | undefined): boolean {
  if (!previous || !isSameResolvedRoute(current, previous)) {
    return false
  }

  return current.state.length === previous.state.length
    && current.state.every((value, index) => Object.is(value, previous.state[index]))
}

function prefetchComponentsForRoute(strategy: PrefetchStrategy, route: ResolvedRoute, configs: PrefetchConfigs): void {
  loadAsyncComponents(route, (match, view) => getPrefetchOption({
    ...configs,
    routePrefetch: match.prefetch,
    viewPrefetch: view.prefetch,
  }, 'components') === strategy)
}
