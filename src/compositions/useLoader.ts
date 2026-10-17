import { computed, InjectionKey, shallowRef, toRaw, watch } from 'vue'
import { AnyLoader, isLoader, Loader } from '@/types/loader'
import { LoaderResult } from '@/types/loaderResult'
import { Router } from '@/types/router'
import { DataResult } from '@/services/createDataStore'
import { createUseRouter } from '@/compositions/useRouter'
import { createUseRouteValueStore } from '@/compositions/useRouteValueStore'
import { getLoaderLocation } from '@/services/getLoaderLocation'
import { RouteContext } from '@/types/routeContext'
import { ValueLocation } from '@/services/getComputations'

export type UseLoader = <TData>(loader: Loader<TData, readonly RouteContext[]>) => LoaderResult<Awaited<TData>>

export function createUseLoader(routerKey: InjectionKey<Router>): UseLoader {
  const useRouter = createUseRouter(routerKey)
  const useRouteValueStore = createUseRouteValueStore(routerKey)

  function useLoader<TData>(loader: Loader<TData, readonly RouteContext[]>): LoaderResult<Awaited<TData>>
  function useLoader(source: AnyLoader): LoaderResult {
    const loader = toRaw(source)

    if (!isLoader(loader)) {
      throw new TypeError('Expected a loader created by createLoader')
    }

    const router = useRouter()
    const store = useRouteValueStore()
    const selection = shallowRef<{ location: ValueLocation } | { error: unknown }>()

    function getLocation(): ValueLocation {
      return getLoaderLocation(router.route, loader) ?? store.loadLoader(loader, router.route)
    }

    watch([() => router.route.matches, () => router.route.href, () => router.route.state, router.started], () => {
      if (!router.started.value) {
        return
      }

      try {
        selection.value = { location: getLocation() }
      } catch (error) {
        selection.value = { error }
      }
    }, { immediate: true })

    const state = computed<DataResult>(() => {
      if (!selection.value) {
        return { kind: 'pending' }
      }

      if ('error' in selection.value) {
        return { kind: 'error', error: selection.value.error }
      }

      return store.getLoaderState(selection.value.location, router.route)
    })

    async function getData(): Promise<unknown> {
      if (!router.started.value) {
        await router.start()
      }

      return store.getLoaderData(getLocation(), router.route)
    }

    return {
      data: computed(() => {
        if (state.value.kind === 'value') return state.value.value
        return undefined
      }),
      loading: computed(() => ['missing', 'pending', 'running'].includes(state.value.kind)),
      error: computed(() => {
        if (state.value.kind === 'error') return state.value.error
        return undefined
      }),
      then(onfulfilled, onrejected) {
        return getData().then(onfulfilled, onrejected)
      },
    }
  }

  return useLoader
}
