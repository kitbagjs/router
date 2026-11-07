import { computed, ComputedRef, ref } from 'vue'

/**
 * The units of work one navigation waits on, counted as they are planned and as they settle. Every method
 * is a no-op once the navigation is over, so late results cannot change its final counts.
 */
export type NavigationProgressTracker = {
  /**
   * Plans units that will be tracked later.
   */
  expect: (count: number) => void,
  /**
   * Counts each unit as settled when it does, however it settles. Only units already expected.
   */
  track: (...units: Promise<unknown>[]) => void,
  /**
   * Nothing more will be tracked. The navigation ends once every tracked unit has settled.
   */
  close: () => void,
}

export type NavigationProgressOptions = {
  expected?: number,
  inert?: boolean,
}

type CreateNavigationProgressOptions = NavigationProgressOptions & {
  signal: AbortSignal,
}

export type NavigationProgress = NavigationProgressTracker & {
  pending: ComputedRef<boolean>,
  settled: ComputedRef<number>,
  total: ComputedRef<number>,
  progress: ComputedRef<number>,
}

export function createNavigationProgress({ signal, expected = 0, inert = false }: CreateNavigationProgressOptions): NavigationProgress {
  const active = ref(!inert && !signal.aborted)
  const completed = ref(0)
  const expectedUnits = ref(0)
  let closed = false

  if (active.value) {
    expectedUnits.value = expected
  }

  function endIfSettled(): void {
    if (closed && completed.value >= expectedUnits.value) {
      active.value = false
    }
  }

  function onSettle(): void {
    if (!active.value) {
      return
    }

    completed.value += 1
    endIfSettled()
  }

  const expect: NavigationProgressTracker['expect'] = (count) => {
    if (active.value) {
      expectedUnits.value += count
    }
  }

  const track: NavigationProgressTracker['track'] = (...units) => {
    if (!active.value) {
      return
    }

    for (const unit of units) {
      unit.then(onSettle, onSettle)
    }
  }

  const close: NavigationProgressTracker['close'] = () => {
    if (!active.value) {
      return
    }

    closed = true
    endIfSettled()
  }

  function abort(): void {
    if (!active.value) {
      return
    }

    completed.value = 0
    expectedUnits.value = 0
    active.value = false
  }

  signal.addEventListener('abort', abort, { once: true })

  const pending = computed(() => active.value)
  const settled = computed(() => completed.value)
  const total = computed(() => expectedUnits.value)
  const progress = computed(() => {
    if (!active.value || expectedUnits.value === 0) {
      return 0
    }

    return completed.value / expectedUnits.value
  })

  return {
    expect,
    track,
    close,
    pending,
    settled,
    total,
    progress,
  }
}
