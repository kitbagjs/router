import { MaybeRefOrGetter, onBeforeUnmount, onMounted, ref, Ref, toValue, watch } from 'vue'
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
  const { observe, unobserve, isElementVisible } = useVisibilityObserver()

  const commit: UsePrefetching['commit'] = () => {
    const props = {}
    
    prefetchedProps.forEach((value) => {
      Object.assign(props, value)
    })

    setPrefetchProps(props)
  }

  onMounted(() => {
    if (!element.value) {
      console.warn('The usePrefetching composition will not work correctly if the element ref is not bound.')
      return
    }

    observe(element.value)
  })

  onBeforeUnmount(() => {
    if (!element.value) {
      return
    }

    unobserve(element.value)
  })

  watch(() => toValue(config), ({ route, ...configs }) => {
    prefetchedProps.clear()

    if (!route) {
      return
    }

    doPrefetchingForStrategy('eager', route, configs)

  }, { immediate: true })

  watch(() => Boolean(element.value) && isElementVisible(element.value!), (isVisible) => {
    const { route, ...configs } = toValue(config)

    if (!route || !isVisible) {
      return
    }

    doPrefetchingForStrategy('lazy', route, configs)
  }, { immediate: true })

  function doPrefetchingForStrategy(strategy: PrefetchStrategy, route: ResolvedRoute, configs: PrefetchConfigs): void {
    prefetchComponentsForRoute(strategy, route, configs)

    prefetchedProps.set(strategy, getPrefetchProps(strategy, route, configs))
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

    if (!routeStrategy || routeStrategy !== strategy) {
      return
    }

    if (isWithComponent(route) && isAsyncComponent(route.component)) {
      route.component.setup()
    }

    if (isWithComponents(route)) {
      Object.values(route.components).forEach((component) => {
        if (isAsyncComponent(component)) {
          component.setup()
        }
      })
    }
  })
}
