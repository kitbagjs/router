import { nextTick } from 'vue'
import { ViewTransitionTypes } from '@/types/viewTransition'
import { supportsViewTransitionTypes } from '@/utilities/viewTransition'

export type ViewTransitions = {
  /**
   * Runs the update inside a view transition. Resolves once the update has run, ahead of the animation,
   * with the transition that is animating it.
   */
  start: (update: () => void, types: ViewTransitionTypes) => Promise<ViewTransition>,
}

type Pending = {
  update: () => void,
  committed: PromiseWithResolvers<void>,
  started: PromiseWithResolvers<ViewTransition>,
}

/**
 * Owns the one transition the document runs at a time. Starting another while the first has not yet run
 * its callback leaves the browser free to run the two callbacks in either order, so a navigation arriving
 * then takes over the pending callback instead. Once the callback has run the browser skips the old
 * animation on its own.
 */
export function createViewTransitions(): ViewTransitions {
  let pending: Pending | undefined

  const start: ViewTransitions['start'] = (update, types) => {
    if (pending) {
      pending.update = update

      return settled(pending)
    }

    const slot: Pending = {
      update,
      committed: Promise.withResolvers(),
      started: Promise.withResolvers(),
    }

    pending = slot

    const transition = startViewTransition(async () => {
      pending = undefined

      try {
        slot.update()
      } catch (error) {
        slot.committed.reject(error)

        throw error
      }

      slot.committed.resolve()

      await nextTick()
    }, types)

    // a transition the browser skips rejects these, and an update that throws is reported through committed
    transition.ready.catch(() => {})
    transition.finished.catch(() => {})
    transition.updateCallbackDone.catch(() => {})

    slot.started.resolve(transition)

    return settled(slot)
  }

  return {
    start,
  }
}

function settled({ committed, started }: Pending): Promise<ViewTransition> {
  return committed.promise.then(() => started.promise)
}

function startViewTransition(update: () => Promise<void>, types: ViewTransitionTypes): ViewTransition {
  if (supportsViewTransitionTypes()) {
    return document.startViewTransition({ update, types })
  }

  return document.startViewTransition(update)
}
