import { computed, ComputedRef, ref, shallowRef } from 'vue'
import { ResolvedRoute } from '@/types/resolved'

/**
 * The units of work one navigation waits on, counted as they are planned and as they settle. Every method
 * is a no-op once the navigation is over or another has begun, so a unit settling late never counts
 * against a later navigation.
 */
export type NavigationLedger = {
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
  /**
   * Ends the navigation as done, whatever is still outstanding. A rejection is a page too.
   */
  complete: () => void,
  /**
   * Ends the navigation as having gone nowhere, wiping its counts.
   */
  abort: () => void,
}

export type NavigationProgressState = {
  pending: ComputedRef<boolean>,
  to: ComputedRef<ResolvedRoute | null>,
  from: ComputedRef<ResolvedRoute | null>,
  settled: ComputedRef<number>,
  total: ComputedRef<number>,
  progress: ComputedRef<number>,
}

type BeginContext = {
  to: ResolvedRoute | null,
  from: ResolvedRoute | null,
  /**
   * Units known before anything runs, so the total never shrinks a navigation's progress midway.
   */
  expected: number,
  /**
   * An inert ledger counts nothing and leaves the state alone, for navigations with nothing to show.
   */
  inert?: boolean,
}

export type NavigationProgress = NavigationProgressState & {
  /**
   * Begins counting a navigation, discarding whatever the navigation before it still had outstanding.
   */
  begin: (context: BeginContext) => NavigationLedger,
  /**
   * Aborts the navigation being counted, if any.
   */
  stop: () => void,
}

export function createNavigationProgress(): NavigationProgress {
  const pending = ref(false)
  const settled = ref(0)
  const total = ref(0)
  const to = shallowRef<ResolvedRoute | null>(null)
  const from = shallowRef<ResolvedRoute | null>(null)

  let current: NavigationLedger | undefined

  const begin: NavigationProgress['begin'] = (context) => {
    let closed = false

    const isActive = (): boolean => current === ledger

    function end(): void {
      current = undefined
      pending.value = false
      to.value = null
      from.value = null
    }

    function endIfSettled(): void {
      if (closed && settled.value >= total.value) {
        end()
      }
    }

    function onSettle(): void {
      if (!isActive()) {
        return
      }

      settled.value += 1
      endIfSettled()
    }

    const expect: NavigationLedger['expect'] = (count) => {
      if (isActive()) {
        total.value += count
      }
    }

    const track: NavigationLedger['track'] = (...units) => {
      if (!isActive()) {
        return
      }

      for (const unit of units) {
        unit.then(onSettle, onSettle)
      }
    }

    const close: NavigationLedger['close'] = () => {
      if (!isActive()) {
        return
      }

      closed = true
      endIfSettled()
    }

    const complete: NavigationLedger['complete'] = () => {
      if (!isActive()) {
        return
      }

      settled.value = total.value
      end()
    }

    const abort: NavigationLedger['abort'] = () => {
      if (!isActive()) {
        return
      }

      settled.value = 0
      total.value = 0
      end()
    }

    const ledger: NavigationLedger = {
      expect,
      track,
      close,
      complete,
      abort,
    }

    if (!context.inert) {
      current = ledger
      pending.value = true
      settled.value = 0
      total.value = context.expected
      to.value = context.to
      from.value = context.from
    }

    return ledger
  }

  const stop: NavigationProgress['stop'] = () => {
    current?.abort()
  }

  return {
    begin,
    stop,
    pending: computed(() => pending.value),
    to: computed(() => to.value),
    from: computed(() => from.value),
    settled: computed(() => settled.value),
    total: computed(() => total.value),
    progress: computed(() => {
      if (!pending.value || total.value === 0) {
        return 0
      }

      return settled.value / total.value
    }),
  }
}
