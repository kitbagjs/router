import { ValueLocation } from '@/types/computation'
import { computed, InjectionKey, onScopeDispose, shallowRef, toRaw, watch } from 'vue'
import { AnyLoader, isLoader, Loader } from '@/types/loader'
import { UseLoader } from '@/types/useLoader'
import { Router } from '@/types/router'
import { isRouter } from '@/types/routerInternal'
import { DataResult } from '@/services/createDataStore'
import { createUseRouter } from '@/compositions/useRouter'
import { useIsServerRendering } from '@/compositions/useIsServerRendering'
import { createUseNavigationEntry } from '@/compositions/useNavigationEntry'
import { getLoaderLocation } from '@/services/getLoaderLocation'
import { RouteContext } from '@/types/routeContext'
import { warnLoaderFallback } from '@/services/warnLoaderFallback'
import { getFallbackLoaderLocation } from '@/services/getFallbackLoaderLocation'
import { getFallbackLoaderComputation } from '@/services/getFallbackLoaderComputation'
import { createUseAwaitedLoader } from '@/compositions/useAwaitedLoader'

type LoaderSelection = { location: ValueLocation<'loader'> } | { error: unknown }

export type UseLoaderFunction = <TData>(loader: Loader<TData, readonly RouteContext[]>) => UseLoader<Awaited<TData>>

export function createUseLoader(routerKey: InjectionKey<Router>): UseLoaderFunction {
  const useRouter = createUseRouter(routerKey)
  const useNavigationEntry = createUseNavigationEntry(routerKey)
  const useAwaitedLoader = createUseAwaitedLoader(routerKey)

  function useLoader<TData>(loader: Loader<TData, readonly RouteContext[]>): UseLoader<Awaited<TData>>
  function useLoader(source: AnyLoader): UseLoader {
    const loader = toRaw(source)

    if (!isLoader(loader)) {
      throw new TypeError('Expected a loader created by createLoader')
    }

    const router = useRouter()

    if (!isRouter(router)) {
      throw new TypeError('Expected a router created by createRouter')
    }

    const entry = useNavigationEntry()
    const isServerRendering = useIsServerRendering()

    const selection = shallowRef<LoaderSelection>()
    const controller = new AbortController()

    const getLocation = (): ValueLocation<'loader'> => {
      if (!entry.value) {
        throw new Error('Expected a navigation entry before selecting a loader')
      }

      const { route, store } = entry.value
      const result = getLoaderLocation(route, loader)

      if ('location' in result) {
        return result.location
      }

      const location = getFallbackLoaderLocation(loader)
      const state = store.getState(location, route)

      if (state.status !== 'MISSING') {
        return location
      }

      warnLoaderFallback({
        loader,
        route,
        fallback: result,
        isServerRendering,
      })

      const computation = getFallbackLoaderComputation(loader, route)
      router.addContext(loader.context)
      store.compute(route, [computation])

      return location
    }

    function selectLoader(): void {
      if (controller.signal.aborted) {
        return
      }

      try {
        const location = getLocation()

        selection.value = { location }
      } catch (error) {
        selection.value = { error }
      }
    }

    async function initialize(): Promise<void> {
      try {
        if (!router.started.value) {
          await router.start()
        }

        selectLoader()
      } catch (error) {
        if (controller.signal.aborted) {
          return
        }

        selection.value = { error }
      }
    }

    watch(entry, selectLoader)

    onScopeDispose(() => {
      controller.abort()
    })

    initialize()

    const state = computed<DataResult>(() => {
      if (!selection.value || !entry.value) {
        return { status: 'PENDING' }
      }

      if ('error' in selection.value) {
        return { status: 'ERROR', error: selection.value.error, source: 'loader' }
      }

      const result = entry.value.store.getState(selection.value.location, entry.value.route)

      if (result.status === 'PUSH' || result.status === 'REJECT') {
        return { status: 'ABANDONED' }
      }

      return result
    })

    const data = computed(() => {
      if (state.value.status === 'SUCCESS') {
        return state.value.value
      }

      return undefined
    })

    const loading = computed(() => {
      return ['MISSING', 'PENDING', 'RUNNING', 'ABANDONED'].includes(state.value.status)
    })

    const error = computed(() => {
      if (state.value.status === 'ERROR') {
        return state.value.error
      }

      return undefined
    })

    const awaited = useAwaitedLoader({
      state,
      loading,
      signal: controller.signal,
    })

    return {
      data,
      loading,
      error,
      then: awaited.then,
    }
  }

  return useLoader
}
