import { computed, inject, InjectionKey, onScopeDispose, shallowRef, toRaw, watch } from 'vue'
import { Navigation } from '@/services/createNavigation'
import { ValueLocation } from '@/types/computation'
import { AnyLoader, isLoader, Loader } from '@/types/loader'
import { UseLoader } from '@/types/useLoader'
import { Router } from '@/types/router'
import { isRouter } from '@/types/routerInternal'
import { DataResult } from '@/services/createDataStore'
import { createUseRouter } from '@/compositions/useRouter'
import { useIsServerRendering } from '@/compositions/useIsServerRendering'
import { createUseRouterNavigation, getViewNavigationKey } from '@/compositions/useRouterNavigation'
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
  const useRouterNavigation = createUseRouterNavigation(routerKey)
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
    const viewNavigation = inject(getViewNavigationKey(routerKey), null)
    const owner = shallowRef<Navigation | null>(null)
    const isServerRendering = useIsServerRendering()

    const selection = shallowRef<LoaderSelection>()
    const controller = new AbortController()

    const getLocation = (): ValueLocation<'loader'> => {
      if (!owner.value?.route) {
        throw new Error('Expected an active navigation before selecting a loader')
      }

      const { route, store } = owner.value
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
        owner.value = viewNavigation?.value ?? navigation.active.value

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

    if (viewNavigation) {
      watch(viewNavigation, selectLoader)
    } else {
      router.onAfterRouteEnter(selectLoader, { signal: controller.signal })
      router.onAfterRouteUpdate(selectLoader, { signal: controller.signal })
    }

    onScopeDispose(() => {
      controller.abort()
    })

    initialize()

    const state = computed<DataResult>(() => {
      if (!selection.value || !owner.value?.route) {
        return { status: 'PENDING' }
      }

      if ('error' in selection.value) {
        return { status: 'ERROR', error: selection.value.error, source: 'loader' }
      }

      const result = owner.value.store.getState(selection.value.location, owner.value.route)

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
