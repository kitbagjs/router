import { MaybeRefOrGetter, ref, Ref, toValue, watch } from 'vue'
import { usePropStore } from '@/compositions/usePropStore'
import { isWithComponent, isWithComponents } from '@/types/createRouteOptions'
import { getPrefetchOption, PrefetchConfigs, PrefetchStrategy } from '@/types/prefetch'
import { ResolvedRoute } from '@/types/resolved'
import { isAsyncComponent } from '@/utilities/components'
import { useVisibilityObserver } from './useVisibilityObserver'

type UsePrefetchingConfig = PrefetchConfigs & {
  route: ResolvedRoute | undefined,
}

type UsePrefetching = {
  element: Ref<HTMLElement | undefined>,
  commit: () => void,
}

export function usePrefetching(config: MaybeRefOrGetter<UsePrefetchingConfig>): UsePrefetching {
  const prefetchedProps = new Map<PrefetchStrategy, Record<string, unknown>>()
  const element = ref<HTMLElement>()

  const { getPrefetchProps, setPrefetchProps } = usePropStore()
  const { isElementVisible } = useVisibilityObserver(element)

  const commit: UsePrefetching['commit'] = () => {
    const props = Array.from(prefetchedProps.values()).reduce((accumulator, value) => {
      Object.assign(accumulator, value)
      
      return accumulator
    }, {})

    setPrefetchProps(props)
  }

  watch(() => toValue(config), ({ route, ...configs }) => {
    prefetchedProps.clear()

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

  function doPrefetchingForStrategy(strategy: PrefetchStrategy, route: ResolvedRoute, configs: PrefetchConfigs): void {
    prefetchComponentsForRoute(strategy, route, configs)

    if (!prefetchedProps.has(strategy)) {
      prefetchedProps.set(strategy, getPrefetchProps(strategy, route, configs))
    }
  }

  return {
    element,
    commit,
  }
}

function prefetchComponentsForRoute(strategy: PrefetchStrategy, route: ResolvedRoute, configs: PrefetchConfigs): void {

  route.matches.forEach(route => {
    const routeStrategy = getPrefetchOption({
      ...configs,
      routePrefetch: route.prefetch,
    }, 'components')

    if (routeStrategy !== strategy) {
      return
    }

    if (isWithComponent(route) && isAsyncComponent(route.component)) {
      route.component.__asyncLoader()
    }

    if (isWithComponents(route)) {
      Object.values(route.components).forEach((component) => {
        if (isAsyncComponent(component)) {
          component.__asyncLoader()
        }
      })
    }
  })
}
