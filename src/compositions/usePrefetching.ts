import { MaybeRefOrGetter, onMounted, ref, Ref, toValue, watch } from 'vue'
import { usePropStore } from '@/compositions/usePropStore'
import { isWithComponent, isWithComponents } from '@/types/createRouteOptions'
import { getPrefetchOption, PrefetchConfigs, PrefetchStrategy } from '@/types/prefetch'
import { ResolvedRoute } from '@/types/resolved'
import { isAsyncComponent } from '@/utilities/components'

type UsePrefetchingConfig = PrefetchConfigs & {
  route: ResolvedRoute | undefined,
}

type UsePrefetching = {
  element: Ref<HTMLElement | undefined>,
  commit: () => void,
}

export function usePrefetching(config: MaybeRefOrGetter<UsePrefetchingConfig>): UsePrefetching {
  let prefetchedProps: Record<string, unknown> = {}

  const element = ref<HTMLElement>()

  const { getPrefetchProps, setPrefetchProps } = usePropStore()

  const commit: UsePrefetching['commit'] = () => {
    setPrefetchProps(prefetchedProps)
  }

  onMounted(() => {
    if (!element.value) {
      console.warn('The usePrefetching composition will not work correctly if the element ref is not bound.')
    }
  })

  watch(() => toValue(config), ({ route, ...configs }) => {
    if (!route) {
      return
    }

    prefetchComponentsForRoute('eager', route, configs)

    const prefetched = getPrefetchProps('eager', route, configs)

    if (prefetched) {
      prefetchedProps = prefetched
    }

  }, { immediate: true })

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
