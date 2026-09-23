/**
 * Which navigation is under way. Only the latest navigation counts: beginning another makes the one before
 * it moot, and so does stopping the router.
 */
export type NavigationSignals = {
  /**
   * Begins a navigation, aborting the one under way. The controller aborts once a later navigation begins
   * or the router stops, and is already aborted for a navigation begun after the router stopped. The
   * navigation aborts it itself when it ends without committing.
   */
  begin: () => AbortController,
  /**
   * Aborts the navigation under way, and every one begun afterwards.
   */
  stop: () => void,
}

export function createNavigationSignals(): NavigationSignals {
  let controller: AbortController | undefined
  let stopped = false

  const begin: NavigationSignals['begin'] = () => {
    controller?.abort()
    controller = new AbortController()

    if (stopped) {
      controller.abort()
    }

    return controller
  }

  const stop: NavigationSignals['stop'] = () => {
    stopped = true
    controller?.abort()
  }

  return {
    begin,
    stop,
  }
}
