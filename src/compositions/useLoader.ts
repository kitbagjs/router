import { computed, InjectionKey, toRaw } from 'vue'
import { AnyLoader, isLoader, Loader } from '@/types/loader'
import { LoaderResult } from '@/types/loaderResult'
import { Router } from '@/types/router'
import { DataResult } from '@/services/createDataStore'
import { createUseRouter } from '@/compositions/useRouter'
import { createUseRouteValueStore } from '@/compositions/useRouteValueStore'
import { getLoaderLocation } from '@/services/getLoaderLocation'
import { RouteContext } from '@/types/routeContext'

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
    const state = computed<DataResult>(() => {
      if (!router.started.value) {
        return { kind: 'pending' }
      }

      try {
        return store.getLoaderState(getLoaderLocation(router.route, loader), router.route)
      } catch (error) {
        return { kind: 'error', error }
      }
    })

    async function getData(): Promise<unknown> {
      if (!router.started.value) {
        await router.start()
      }

      return store.getValue(getLoaderLocation(router.route, loader), router.route)
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
