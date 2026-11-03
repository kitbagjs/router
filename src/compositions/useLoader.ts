import { computed, InjectionKey, onScopeDispose, shallowRef, toRaw, watch } from 'vue'
import { AnyLoader, isLoader, Loader } from '@/types/loader'
import { UseLoader } from '@/types/useLoader'
import { Router } from '@/types/router'
import { isRouter } from '@/types/routerInternal'
import { DataResult } from '@/services/createDataStore'
import { createUseRouter } from '@/compositions/useRouter'
import { useIsServerRendering } from '@/compositions/useIsServerRendering'
import { createUseRouterNavigation } from '@/compositions/useRouterNavigation'
import { getLoaderLocation } from '@/services/getLoaderLocation'
import { createUseViewRoute } from '@/compositions/useViewRoute'
import { getDataKey } from '@/services/getDataKey'
import { RouteContext } from '@/types/routeContext'
import { ValueLocation } from '@/services/getComputations'
import { warnLoaderFallback } from '@/services/warnLoaderFallback'
import { getFallbackLoaderLocation } from '@/services/getFallbackLoaderLocation'
import { getFallbackLoaderComputation } from '@/services/getFallbackLoaderComputation'
import { createUseAwaitedLoader } from '@/compositions/useAwaitedLoader'

type LoaderSelection = { location: ValueLocation<'loader'> } | { error: unknown }

export type UseLoaderFunction = <TData>(loader: Loader<TData, readonly RouteContext[]>) => UseLoader<Awaited<TData>>

export function createUseLoader(routerKey: InjectionKey<Router>): UseLoaderFunction {
  const useRouter = createUseRouter(routerKey)
  const useRouterNavigation = createUseRouterNavigation(routerKey)
  const useViewRoute = createUseViewRoute(routerKey)
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

    const navigation = useRouterNavigation()
    const route = useViewRoute()
    const isServerRendering = useIsServerRendering()

    const selection = shallowRef<LoaderSelection>()
    const controller = new AbortController()

    const getLocation = (): ValueLocation<'loader'> => {
      const result = getLoaderLocation(route.value, loader)

      if ('location' in result) {
        return result.location
      }

      const location = getFallbackLoaderLocation(loader)
      const state = navigation.get(route.value).getState(getDataKey(location.kind, location.id, location.name, route.value))

      if (state.status !== 'MISSING') {
        return location
      }

      const resolved = route.value

      warnLoaderFallback({
        loader,
        route: resolved,
        fallback: result,
        isServerRendering,
      })

      const computation = getFallbackLoaderComputation(loader, resolved)
      router.addContext(loader.context)
      navigation.get(resolved).compute(resolved, [computation])

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

    watch(route, () => {
      if (router.started.value) {
        selectLoader()
      }
    }, { flush: 'sync' })

    onScopeDispose(() => {
      controller.abort()
    })

    initialize()

    const state = computed<DataResult>(() => {
      if (!selection.value) {
        return { status: 'PENDING' }
      }

      if ('error' in selection.value) {
        return { status: 'ERROR', error: selection.value.error, source: 'loader' }
      }

      const { location } = selection.value
      const result = navigation.get(route.value).getState(getDataKey(location.kind, location.id, location.name, route.value))

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
