import { nextTick } from 'vue'
import { Page } from '@/types/page'
import { RouteValueResponse, RouteValueResponses } from '@/services/createRouteValueStore'
import { DataKind } from '@/services/createNavigationStores'
import { loadAsyncComponents } from '@/utilities/components'
import { PageValues, emptyPageValues } from '@/services/createPageValues'

export type PageCommit = {
  /** Resolves with the first replacement outcome, or success once all required assets are ready. */
  prepare: () => Promise<RouteValueResponse>,
  /** Commits synchronously, then waits for Vue's render update. */
  commit: () => Promise<boolean>,
}

type PageCommitOptions = {
  page: Page,
  signal: AbortSignal,
  values?: PageValues,
  update: (values: RouteValueResponses, components: Promise<unknown>[], prepared: boolean) => void,
  settle: (response: Promise<RouteValueResponse>, source: DataKind) => Promise<RouteValueResponse>,
}

/** The same preparation and render boundary for every page, independent of how it was selected. */
export function createPageCommit({ page, signal, values = emptyPageValues, update, settle }: PageCommitOptions): PageCommit {
  const isAborted = (): boolean => signal.aborted
  const abandoned = Promise.withResolvers<RouteValueResponse>()
  let state: 'progressive' | 'preparing' | 'prepared' | 'abandoned' = 'progressive'

  const dispose = (): void => {
    state = 'abandoned'
    values.dispose()
    abandoned.resolve({ status: 'ABANDONED' })
    signal.removeEventListener('abort', dispose)
  }

  signal.addEventListener('abort', dispose, { once: true })

  const prepare: PageCommit['prepare'] = async () => {
    if (isAborted()) {
      dispose()

      return { status: 'ABANDONED' }
    }

    state = 'preparing'
    try {
      const response = await Promise.race([prepareAssets(), abandoned.promise])

      if (isAborted()) {
        dispose()

        return { status: 'ABANDONED' }
      }

      if (response.status !== 'SUCCESS') {
        dispose()

        return response
      }

      state = 'prepared'

      return response
    } catch (error) {
      dispose()
      throw error
    }
  }

  function prepareAssets(): Promise<RouteValueResponse> {
    const responses = values.prepare()
    const outcome = Promise.withResolvers<RouteValueResponse>()
    const watch = async (response: Promise<RouteValueResponse>, source: DataKind): Promise<void> => {
      const result = await settle(response, source)

      if (result.status !== 'SUCCESS') {
        outcome.resolve(result)
      }
    }
    const work = Promise.all([
      watch(responses.props, 'props'),
      watch(responses.loaders, 'loader'),
      ...loadAsyncComponents(page.assets),
    ])

    work.then(() => outcome.resolve({ status: 'SUCCESS' }), outcome.reject)

    return outcome.promise
  }

  const commit: PageCommit['commit'] = () => {
    if (isAborted() || state === 'preparing' || state === 'abandoned') {
      return Promise.resolve(false)
    }

    const responses = values.commit()
    signal.removeEventListener('abort', dispose)
    update(responses, loadAsyncComponents(page.assets), state === 'prepared')

    return nextTick().then(() => !signal.aborted)
  }

  return { prepare, commit }
}
