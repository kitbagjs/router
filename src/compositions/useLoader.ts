import { computed, InjectionKey, toRaw } from 'vue'
import { AnyLoader, isLoader, Loader } from '@/types/loader'
import { UseLoader } from '@/types/useLoader'
import { Router } from '@/types/router'
import { DataResult } from '@/services/createDataStore'
import { createUseRouter } from '@/compositions/useRouter'
import { createUseRouterNavigation } from '@/compositions/useRouterNavigation'
import { getLoaderLocation } from '@/services/getLoaderLocation'
import { RouteContext } from '@/types/routeContext'

export type UseLoaderFunction = <TData>(loader: Loader<TData, readonly RouteContext[]>) => UseLoader<Awaited<TData>>

export function createUseLoader(routerKey: InjectionKey<Router>): UseLoaderFunction {
  const useRouter = createUseRouter(routerKey)
  const useRouterNavigation = createUseRouterNavigation(routerKey)

  function useLoader<TData>(loader: Loader<TData, readonly RouteContext[]>): UseLoader<Awaited<TData>>
  function useLoader(source: AnyLoader): UseLoader {
    const loader = toRaw(source)

    if (!isLoader(loader)) {
      throw new TypeError('Expected a loader created by createLoader')
    }

    const router = useRouter()
    const navigation = useRouterNavigation()
    const state = computed<DataResult>(() => {
      if (!router.started.value) {
        return { kind: 'pending' }
      }

      try {
        const location = getLoaderLocation(router.route, loader)

        return navigation.getLoaderState(location, router.route)
      } catch (error) {
        return { kind: 'error', error }
      }
    })

    async function getData(): Promise<unknown> {
      if (!router.started.value) {
        await router.start()
      }

      const location = getLoaderLocation(router.route, loader)

      return navigation.getLoaderValue(location, router.route)
    }

    const data = computed(() => {
      if (state.value.kind === 'value') {
        return state.value.value
      }

      return undefined
    })

    const loading = computed(() => {
      return ['missing', 'pending', 'running'].includes(state.value.kind)
    })

    const error = computed(() => {
      if (state.value.kind === 'error') {
        return state.value.error
      }

      return undefined
    })

    const result = {
      data,
      loading,
      error,
    }

    return {
      ...result,
      then: (onfulfilled, onrejected) => {
        return getData()
          .then(() => result, () => result)
          .then(onfulfilled, onrejected)
      },
    }
  }

  return useLoader
}
