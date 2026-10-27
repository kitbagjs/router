import { computed, ComputedRef, InjectionKey, shallowRef, watch } from 'vue'
import { DataResult } from '@/services/createDataStore'
import { Router } from '@/types/router'
import { UseLoaderResolved } from '@/types/useLoader'
import { createUseRouterSuspense } from '@/compositions/useRouterSuspense'

type UseAwaitedLoaderOptions = {
  state: ComputedRef<DataResult>,
  loading: ComputedRef<boolean>,
  signal: AbortSignal,
}

type UseAwaitedLoader = (options: UseAwaitedLoaderOptions) => PromiseLike<UseLoaderResolved>

export function createUseAwaitedLoader(routerKey: InjectionKey<Router>): UseAwaitedLoader {
  const useRouterSuspense = createUseRouterSuspense(routerKey)

  return ({ state, loading, signal }) => {
    const reportError = useRouterSuspense('loader')

    const resolved = shallowRef(false)
    const loadedData = computed((previous: unknown) => {
      const current = state.value

      if (current.status === 'SUCCESS') {
        return current.value
      }

      return previous
    })
    let waiting: PromiseWithResolvers<unknown> | undefined

    watch(state, (current) => {
      if (current.status === 'SUCCESS') {
        // Read every success so the next load retains it even when the component has not read data.
        const value = loadedData.value
        waiting?.resolve(value)
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
      if (signal.aborted) {
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

    return {
      then: (onfulfilled, onrejected) => {
        return getData()
          .then(() => {
            resolved.value = true

            return { data: loadedData, loading }
          }, (error: unknown) => {
            const handled = reportError(error)

            if (handled) {
              return new Promise<never>(() => {})
            }

            throw error
          })
          .then(onfulfilled, onrejected)
      },
    }
  }
}
