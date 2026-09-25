import { nextTick, shallowReactive } from 'vue'
import { ResolvedRoute } from '@/types/resolved'
import { RouterViewTransition, ViewTransitionTypes } from '@/types/viewTransition'
import { supportsViewTransitionTypes } from '@/utilities/viewTransition'

export type PendingViewTransition = {
  to: ResolvedRoute,
  from: ResolvedRoute,
  types: ViewTransitionTypes,
}

export type ViewTransitions = {
  /**
   * The transition in flight, as the router exposes it.
   */
  viewTransition: RouterViewTransition,
  /**
   * Records the navigation about to transition, ahead of its data loading, so the page being left can
   * prepare before it is captured.
   */
  prepare: (navigation: PendingViewTransition) => void,
  /**
   * Forgets a prepared navigation that was superseded before it transitioned, unless a newer one has
   * taken over the state since.
   */
  cancel: (navigation: PendingViewTransition) => void,
  /**
   * Forgets the transition in flight, for a navigation that commits without one.
   */
  reset: () => void,
  /**
   * Runs the update inside a view transition. Resolves after the update and Vue flush, ahead of the animation.
   */
  start: (update: () => void | Promise<void>) => Promise<void>,
}

type Pending = {
  update: () => void | Promise<void>,
  committed: PromiseWithResolvers<void>,
  transition?: ViewTransition,
}

/**
 * Owns the one transition the document runs at a time. Starting another while the first has not yet run
 * its callback leaves the browser free to run the two callbacks in either order, so a navigation arriving
 * then takes over the pending callback instead. Once the callback has run the browser skips the old
 * animation on its own.
 */
export function createViewTransitions(): ViewTransitions {
  const viewTransition = shallowReactive<RouterViewTransition>(idle())
  let pending: Pending | undefined
  let transitionId = 0

  const prepare: ViewTransitions['prepare'] = (navigation) => {
    transitionId++

    Object.assign(viewTransition, {
      isTransitioning: true,
      ...navigation,
      transition: undefined,
    })
  }

  const reset: ViewTransitions['reset'] = () => {
    transitionId++

    Object.assign(viewTransition, idle())
  }

  const cancel: ViewTransitions['cancel'] = (navigation) => {
    if (viewTransition.to === navigation.to) {
      reset()
    }
  }

  const start: ViewTransitions['start'] = (update) => {
    if (pending) {
      pending.update = update
      adopt(pending)

      return pending.committed.promise
    }

    const slot: Pending = { update, committed: Promise.withResolvers() }

    pending = slot

    slot.transition = startViewTransition(async () => {
      pending = undefined

      try {
        await slot.update()
        await nextTick()
        slot.committed.resolve()
      } catch (error) {
        slot.committed.reject(error)

        throw error
      }
    }, viewTransition.types)

    // a transition the browser skips rejects these, and an update that throws is reported through committed
    slot.transition.ready.catch(() => {})
    slot.transition.updateCallbackDone.catch(() => {})

    adopt(slot)

    return slot.committed.promise
  }

  /**
   * Exposes the transition and forgets it once it finishes, unless a newer navigation owns the state by then.
   */
  function adopt({ transition }: Pending): void {
    if (!transition) {
      return
    }

    const id = transitionId

    Object.assign(viewTransition, { transition })

    const finish = (): void => {
      if (transitionId === id) {
        reset()
      }
    }

    transition.finished.then(finish, finish)
  }

  return {
    viewTransition,
    prepare,
    cancel,
    reset,
    start,
  }
}

function idle(): RouterViewTransition {
  return {
    isTransitioning: false,
    to: undefined,
    from: undefined,
    types: [],
    transition: undefined,
  }
}

function startViewTransition(update: () => Promise<void>, types: ViewTransitionTypes): ViewTransition {
  if (supportsViewTransitionTypes()) {
    return document.startViewTransition({ update, types })
  }

  return document.startViewTransition(update)
}
