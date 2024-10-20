import { computed, MaybeRef, ref, watch } from 'vue'
import { isWithComponent, isWithComponents } from '@/types/createRouteOptions'
import { getPrefetchOption, PrefetchConfigs } from '@/types/prefetch'
import { ResolvedRoute } from '@/types/resolved'
import { isAsyncComponent } from '@/utilities/components'

export function usePrefetchedComponent(route: MaybeRef<ResolvedRoute | undefined>, prefetch: MaybeRef<PrefetchConfigs | undefined>): void {
  const routeRef = ref(route)
  const prefetchRef = ref(prefetch)

  const matchesToPrefetchComponents = computed(() => {
    const matches = routeRef.value?.matches ?? []

    return matches.filter(route => getPrefetchOption({
      ...prefetchRef.value,
      routePrefetch: route.prefetch,
    }, 'components'))
  })

  watch(matchesToPrefetchComponents, routes => {
    routes.forEach(route => {
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
  }, { immediate: true })
}