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
import { isRouterRoute } from '@/services/createRouterRoute'
import { RouteContext } from '@/types/routeContext'
import { ValueLocation } from '@/services/getComputations'
import { warnLoaderFallback } from '@/services/warnLoaderFallback'
import { getFallbackLoaderLocation } from '@/services/getFallbackLoaderLocation'
import { getFallbackLoaderComputation } from '@/services/getFallbackLoaderComputation'
import { createUseRouterSuspense } from '@/compositions/useRouterSuspense'

type LoaderSelection = { location: ValueLocation<'loader'> } | { error: unknown }

export type UseLoaderFunction = <TData>(loader: Loader<TData, readonly RouteContext[]>) => UseLoader<Awaited<TData>>

export function createUseLoader(routerKey: InjectionKey<Router>): UseLoaderFunction {
  const useRouter = createUseRouter(routerKey)
  const useRouterNavigation = createUseRouterNavigation(routerKey)
  const useRouterSuspense = createUseRouterSuspense(routerKey)

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
    const reportError = useRouterSuspense()
    const isServerRendering = useIsServerRendering()

    const selection = shallowRef<LoaderSelection>()
    const controller = new AbortController()

    const getLocation = (): ValueLocation<'loader'> => {
      const result = getLoaderLocation(router.route, loader)

      if ('location' in result) {
        return result.location
      }

      const location = getFallbackLoaderLocation(loader)
      const state = navigation.getLoaderState(location, router.route)

      if (state.status !== 'MISSING') {
        return location
      }

      if (!isRouterRoute(routerKey, router.route)) {
        throw new TypeError('Expected a router route for this router')
      }

      const route = router.route.getResolvedRoute()

      warnLoaderFallback({
        loader,
        route,
        fallback: result,
        isServerRendering,
      })

      const computation = getFallbackLoaderComputation(loader, route)
      router.addContext(loader.context)
      navigation.current().compute(route, [computation])

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

    router.onAfterRouteEnter(selectLoader, { signal: controller.signal })
    router.onAfterRouteUpdate(selectLoader, { signal: controller.signal })

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

      return navigation.getLoaderState(selection.value.location, router.route)
    })

    const resolved = shallowRef(false)
    const lastSuccess = shallowRef<{ value: unknown }>()
    let waiting: PromiseWithResolvers<unknown> | undefined

    watch(state, (current) => {
      if (current.status === 'SUCCESS') {
        lastSuccess.value = { value: current.value }
        waiting?.resolve(current.value)
      } else if (current.status === 'ERROR') {
        waiting?.reject(current.error)
      } else {
        return
      }

      waiting = undefined
    }, { immediate: true, flush: 'sync' })

    // Later failures belong to the component's error boundary; the initial await is already settled.
    watch([state, resolved], ([current, hasResolved]) => {
      if (!hasResolved || current.status !== 'ERROR') {
        return
      }

      const handled = reportError(current.error)

      if (!handled) {
        throw current.error
      }
    }, { flush: 'post' })

    async function getData(): Promise<unknown> {
      if (controller.signal.aborted) {
        return new Promise<never>(() => {})
      }

      const current = state.value

      if (current.status === 'SUCCESS') {
        return current.value
      }

      if (current.status === 'ERROR') {
        throw current.error
      }

      waiting ??= Promise.withResolvers<unknown>()

      return waiting.promise
    }

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

    const result = {
      data,
      loading,
      error,
    }

    const loadedData = computed(() => lastSuccess.value?.value)

    return {
      ...result,
      then: (onfulfilled, onrejected) => {
        return getData()
          .then(() => {
            resolved.value = true

            return { data: loadedData, loading }
          }, (error: unknown) => {
            reportError(error, { rethrow: true })
            throw error
          })
          .then(onfulfilled, onrejected)
      },
    }
  }

  return useLoader
}
