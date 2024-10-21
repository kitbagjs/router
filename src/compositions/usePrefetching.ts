import { MaybeRefOrGetter, toValue, watch } from 'vue'
import { usePropStore } from '@/compositions/usePropStore'
import { isWithComponent, isWithComponents } from '@/types/createRouteOptions'
import { getPrefetchOption, PrefetchConfigs } from '@/types/prefetch'
import { ResolvedRoute } from '@/types/resolved'
import { isAsyncComponent } from '@/utilities/components'

type UsePrefetchingConfig = PrefetchConfigs & {
  route: ResolvedRoute | undefined,
}

type UsePrefetching = {
  commit: () => void,
}

export function usePrefetching(config: MaybeRefOrGetter<UsePrefetchingConfig>): UsePrefetching {
  let props: Record<string, unknown> = {}

  const { getPrefetchProps, setPrefetchProps } = usePropStore()

  watch(() => toValue(config), ({ route, ...configs }) => {
    if (!route) {
      return
    }

    prefetchComponentsForRoute(route, configs)

    props = getPrefetchProps(route, configs)
  }, { immediate: true })

  const commit: UsePrefetching['commit'] = () => {
    setPrefetchProps(props)
  }

  return {
    commit,
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