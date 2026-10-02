import { nextTick } from 'vue'
import { RouteValueResponse, RouteValueStore } from '@/services/createRouteValueStore'
import { ResolvedRoute } from '@/types/resolved'
import { loadAsyncComponents } from '@/utilities/components'

export type RoutePreparation = {
  props: PromiseSettledResult<RouteValueResponse>,
  loaders: PromiseSettledResult<RouteValueResponse>,
  components: PromiseSettledResult<unknown>[],
}

type RouteCommitOptions = {
  route: ResolvedRoute | null,
  signal: AbortSignal,
  valueStore: RouteValueStore,
  update: () => void,
}

export type RouteCommit = {
  /**
   * Computes destination values in the staged store and loads its lazy components while the current
   * route stays rendered. Outcomes are inspected by the caller; committing keeps the router's existing
   * response handling. Returns undefined if there is no destination or this navigation is abandoned.
   */
  prepare: () => Promise<RoutePreparation | undefined>,
  /**
   * Updates the route and waits for Vue's DOM flush. False means this navigation was abandoned before
   * or during the flush. Pending route data, async setup, and later layout changes are not awaited.
   */
  commit: () => Promise<boolean>,
}

/**
 * The preparation and DOM commit of one navigation. Keeping them separate lets a browser feature
 * prepare before capturing the outgoing page, then wrap the same commit that ordinary navigation uses.
 */
export function createRouteCommit({ route, signal, valueStore, update }: RouteCommitOptions): RouteCommit {
  const isAborted = (): boolean => signal.aborted

  const prepare: RouteCommit['prepare'] = async () => {
    if (isAborted() || !route) {
      return
    }

    const abandoned = Promise.withResolvers<undefined>()
    const listener = new AbortController()

    signal.addEventListener('abort', () => {
      abandoned.resolve(undefined)
    }, { signal: listener.signal })

    try {
      const values = valueStore.staged().compute(route)
      const work = Promise.allSettled([
        values.props,
        values.loaders,
        ...loadAsyncComponents(route),
      ])
      const results = await Promise.race([work, abandoned.promise])

      if (!results || isAborted()) {
        return
      }

      const [props, loaders, ...components] = results

      return { props, loaders, components }
    } finally {
      listener.abort()
    }
  }

  const commit: RouteCommit['commit'] = () => {
    if (signal.aborted) {
      return Promise.resolve(false)
    }

    update()

    return nextTick().then(() => !signal.aborted)
  }

  return { prepare, commit }
}
