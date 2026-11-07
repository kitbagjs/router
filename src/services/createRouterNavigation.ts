import { computed, shallowRef, Ref } from 'vue'
import { createComputationStore, ComputationStore } from '@/services/createComputationStore'
import { createNavigation, Navigation, NavigationOptions } from '@/services/createNavigation'
import { UseNavigation } from '@/types/navigation'
import { createVueAppStore, HasVueAppStore } from '@/services/createVueAppStore'

export type { NavigationData } from '@/services/createComputationStore'

type RunNavigationOptions = NavigationOptions & {
  prefetch?: ComputationStore,
}

export type RouterNavigation = HasVueAppStore & {
  active: Readonly<Ref<Navigation | null>>,
  progress: UseNavigation,
  run: (options: RunNavigationOptions) => Promise<void>,
  createStore: () => ComputationStore,
  stop: () => void,
}

export function createRouterNavigation(): RouterNavigation {
  const { setVueApp, runWithContext } = createVueAppStore()
  const active = shallowRef<Navigation | null>(null)
  const latest = shallowRef<Navigation | null>(null)
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
    const previous = latest.value
    previous?.controller.abort()

    if (previous && previous !== active.value) {
      previous.store.dispose()
    }

    if (stopped) {
      return Promise.resolve()
    }

    const next = createNavigation({
      ...options,
      store: prefetch ?? createStore(),
      activate,
    })
    latest.value = next

    function cleanup(): void {
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

  function stop(): void {
    stopped = true
    latest.value?.controller.abort()
    latest.value?.store.abandon()
    active.value?.store.abandon()
  }

  const pending = computed(() => latest.value?.progress.pending.value ?? false)
  const to = computed(() => {
    if (!pending.value) {
      return null
    }

    return latest.value?.route ?? null
  })
  const from = computed(() => {
    if (!pending.value) {
      return null
    }

    return latest.value?.from ?? null
  })
  const settled = computed(() => latest.value?.progress.settled.value ?? 0)
  const total = computed(() => latest.value?.progress.total.value ?? 0)
  const percentage = computed(() => latest.value?.progress.progress.value ?? 0)
  const progress: UseNavigation = {
    pending,
    to,
    from,
    settled,
    total,
    progress: percentage,
  }

  return {
    active,
    progress,
    run,
    createStore,
    stop,
    setVueApp,
  }
}
