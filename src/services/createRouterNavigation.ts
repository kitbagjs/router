import { shallowRef, Ref } from 'vue'
import { createComputationStore, ComputationStore } from '@/services/createComputationStore'
import { createNavigation, Navigation, NavigationOptions } from '@/services/createNavigation'
import { createVueAppStore, HasVueAppStore } from '@/services/createVueAppStore'

export type { NavigationData } from '@/services/createComputationStore'

type RunNavigationOptions = NavigationOptions & {
  prefetch?: ComputationStore,
}

export type RouterNavigation = HasVueAppStore & {
  active: Readonly<Ref<Navigation | null>>,
  run: (options: RunNavigationOptions) => Promise<void>,
  createStore: () => ComputationStore,
  cancel: () => AbortSignal,
  stop: () => void,
}

export function createRouterNavigation(): RouterNavigation {
  const { setVueApp, runWithContext } = createVueAppStore()
  const active = shallowRef<Navigation | null>(null)
  let pending: Navigation | null = null
  let controller: AbortController | undefined
  let stopped = false

  function createStore(): ComputationStore {
    const store: ComputationStore = createComputationStore({
      runWithContext,
      getCurrent: () => active.value?.store.data ?? store.data,
    })

    return store
  }

  function activate(next: Navigation): void {
    const previous = active.value
    active.value = next

    if (previous && previous.store !== next.store) {
      previous.store.abandon()
    }
  }

  function run({ prefetch, ...options }: RunNavigationOptions): Promise<void> {
    controller?.abort()

    if (pending && pending !== active.value) {
      pending.store.dispose()
    }

    if (stopped) {
      return Promise.resolve()
    }

    const next = createNavigation({
      ...options,
      store: prefetch ?? createStore(),
      activate,
    })
    pending = next
    controller = next.controller

    function cleanup(): void {
      if (pending === next) {
        pending = null
      }

      if (active.value !== next) {
        next.store.dispose()
      }
    }

    try {
      return next.run().finally(cleanup)
    } catch (error) {
      cleanup()

      throw error
    }
  }

  function cancel(): AbortSignal {
    controller?.abort()
    pending?.store.abandon()
    active.value?.store.abandon()
    controller = new AbortController()

    return controller.signal
  }

  function stop(): void {
    stopped = true
    controller?.abort()
    pending?.store.abandon()
    active.value?.store.abandon()
  }

  return {
    active,
    run,
    createStore,
    cancel,
    stop,
    setVueApp,
  }
}
