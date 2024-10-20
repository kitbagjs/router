import { MaybeRef, Ref, ref, watch } from 'vue'
import { usePropStore } from '@/compositions/usePropStore'
import { PrefetchConfigs } from '@/types/prefetch'
import { ResolvedRoute } from '@/types/resolved'

export type UsePrefetchedProps = {
  prefetchProps: Ref<Record<string, unknown>>,
  commitPrefetchedProps: () => void,
}

export function usePrefetchedProps(route: MaybeRef<ResolvedRoute | undefined>, prefetch: MaybeRef<PrefetchConfigs | undefined>): UsePrefetchedProps {
  const routeRef = ref(route)
  const prefetchRef = ref(prefetch)
  const store = usePropStore()
  const prefetchProps = ref<Record<string, unknown>>({})

  watch([routeRef, prefetchRef], ([route, prefetch]) => {
    if (!route) {
      return
    }

    prefetchProps.value = store.getPrefetchProps(route, prefetch ?? {})
  }, { immediate: true })

  function commitPrefetchedProps(): void {
    store.setPrefetchProps(prefetchProps.value)
  }

  return { prefetchProps, commitPrefetchedProps }
}