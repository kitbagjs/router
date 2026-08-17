import { InjectionKey, MaybeRefOrGetter, onScopeDispose, ref, Ref, toValue, watch } from 'vue'
import { createUseRouteValueStore } from '@/compositions/useRouteValueStore'
import type { PrefetchConfigs, PrefetchStrategy } from '@/types/prefetch'
import { getPrefetchOption } from '@/utilities/prefetch'
import { ResolvedRoute } from '@/types/resolved'
import { isAsyncComponent } from '@/utilities/components'
import { useVisibilityObserver } from './useVisibilityObserver'
import { useEventListener } from './useEventListener'
import { Router } from '@/types/router'

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

    const { createPrefetchStore } = useRouteValueStore()
    const store = createPrefetchStore()
    const { isElementVisible } = useVisibilityObserver(element)

    const commit: UsePrefetching['commit'] = () => {
      store.commit()
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
      store.prefetch(strategy, route, configs)
    }

    return {
      element,
      commit,
    }
  }
}

function prefetchComponentsForRoute(strategy: PrefetchStrategy, route: ResolvedRoute, configs: PrefetchConfigs): void {
  route.matches.forEach((match) => {
    Object.values(match.views).forEach((view) => {
      if (!view.component || !isAsyncComponent(view.component)) {
        return
      }

      const viewStrategy = getPrefetchOption({
        ...configs,
        routePrefetch: match.prefetch,
        viewPrefetch: view.prefetch,
      }, 'components')

      if (viewStrategy !== strategy) {
        return
      }

      view.component.__asyncLoader()
    })
  })
}
