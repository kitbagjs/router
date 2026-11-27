import { ValueLocation } from '@/types/computation'
import { computed, InjectionKey, onScopeDispose, shallowRef, toRaw } from 'vue'
import { AnyLoader, isLoader, Loader } from '@/types/loader'
import { UseLoader } from '@/types/useLoader'
import { Router } from '@/types/router'
import { isRouter } from '@/types/routerInternal'
import { DataResult } from '@/services/createDataStore'
import { createUseRouter } from '@/compositions/useRouter'
import { useIsServerRendering } from '@/compositions/useIsServerRendering'
import { createUseRouterNavigation } from '@/compositions/useRouterNavigation'
import { getLoaderLocation } from '@/services/getLoaderLocation'
import { RouteContext } from '@/types/routeContext'
import { warnLoaderFallback } from '@/services/warnLoaderFallback'
import { getFallbackLoaderLocation } from '@/services/getFallbackLoaderLocation'
import { getFallbackLoaderComputation } from '@/services/getFallbackLoaderComputation'
import { createUseAwaitedLoader } from '@/compositions/useAwaitedLoader'
import { createUseRouterDepth } from '@/compositions/useRouterDepth'
import { ComputationStore } from '@/services/createComputationStore'
import { ResolvedRoute } from '@/types/resolved'

type LoaderSelection = { location: ValueLocation<'loader'>, route: ResolvedRoute, store: ComputationStore } | { error: unknown }

export type UseLoaderFunction = <TData>(loader: Loader<TData, readonly RouteContext[]>) => UseLoader<Awaited<TData>>

export function createUseLoader(routerKey: InjectionKey<Router>): UseLoaderFunction {
  const useRouter = createUseRouter(routerKey)
  const useRouterNavigation = createUseRouterNavigation(routerKey)
  const useAwaitedLoader = createUseAwaitedLoader(routerKey)
  const useRouterDepth = createUseRouterDepth(routerKey)

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
    const isServerRendering = useIsServerRendering()
    const route: ResolvedRoute = router.route
    const depth = useRouterDepth()
    const routeId = route.matches[depth - 1]?.id
    const isRouteActive = computed(() => {
      if (!routeId) {
        return true
      }

      return route.matches.some((match) => match.id === routeId)
    })

    const selection = shallowRef<LoaderSelection>()
    const controller = new AbortController()

    const getLocation = (route: ResolvedRoute, store: ComputationStore): ValueLocation<'loader'> => {
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
      if (controller.signal.aborted || !isRouteActive.value) {
        return
      }

      try {
        const active = navigation.active.value

        if (!active?.route) {
          return
        }

        const { route, store } = active
        const location = getLocation(route, store)

        selection.value = { location, route, store }
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

    router.onAfterRouteEnter(selectLoader, { signal: controller.signal })
    router.onAfterRouteUpdate(selectLoader, { signal: controller.signal })

    onScopeDispose(() => {
      controller.abort()
    })

    initialize()

    const state = computed<DataResult>((previous) => {
      if (!isRouteActive.value) {
        return previous ?? { status: 'PENDING' }
      }

      if (!selection.value) {
        return { status: 'PENDING' }
      }

      if ('error' in selection.value) {
        return { status: 'ERROR', error: selection.value.error, source: 'loader' }
      }

      // Preserve the last result until the consumer selects the newly active store.
      if (selection.value.store !== navigation.active.value?.store) {
        return previous ?? { status: 'PENDING' }
      }

      const result = selection.value.store.getState(selection.value.location, selection.value.route)

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
