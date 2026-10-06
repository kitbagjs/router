import { nextTick } from 'vue'
import { Page } from '@/types/page'
import { RouteValueResponse, RouteValueResponses } from '@/services/createRouteValueStore'
import { DataKind } from '@/services/createNavigationStores'
import { loadAsyncComponents } from '@/utilities/components'
import { createAbortPromise } from '@/utilities/promises'

export type PageCommit = {
  /** Resolves with the first replacement outcome, or success once all required assets are ready. */
  prepare: () => Promise<RouteValueResponse>,
  /** Commits synchronously, then waits for Vue's render update. */
  commit: () => Promise<boolean>,
}

type PageCommitOptions = {
  page: Page,
  signal: AbortSignal,
  update: (values: RouteValueResponses, components: Promise<unknown>[], prepared: boolean) => void,
  settle: (response: Promise<RouteValueResponse>, source: DataKind) => Promise<RouteValueResponse>,
}

/** The same preparation and render boundary for every page, independent of how it was selected. */
export function createPageCommit({ page, signal, update, settle }: PageCommitOptions): PageCommit {
  const isAborted = (): boolean => signal.aborted
  const dispose = (): void => {
    page.disposeValues()
    signal.removeEventListener('abort', dispose)
  }
  signal.addEventListener('abort', dispose, { once: true })
  let preparation: RouteValueResponse | undefined
  const prepare: PageCommit['prepare'] = async () => {
    if (isAborted()) {
      return { status: 'ABANDONED' }
    }

    const values = page.prepareValues()
    const outcome = Promise.withResolvers<RouteValueResponse>()
    const watch = async (response: Promise<RouteValueResponse>, source: DataKind): Promise<void> => {
      const result = await settle(response, source)

      if (result.status !== 'SUCCESS') {
        outcome.resolve(result)
      }
    }
    const work = Promise.all([
      watch(values.props, 'props'),
      watch(values.loaders, 'loader'),
      ...loadAsyncComponents(page.assets),
    ])

    work.then(() => outcome.resolve({ status: 'SUCCESS' }), outcome.reject)

    try {
      await Promise.race([outcome.promise, createAbortPromise(signal)])
      preparation = isAborted() ? { status: 'ABANDONED' } : await outcome.promise
    } catch (error) {
      preparation = { status: 'ABANDONED' }
      dispose()
      throw error
    }

    if (preparation.status !== 'SUCCESS') {
      dispose()
    }

    return preparation
  }

  const commit: PageCommit['commit'] = () => {
    const ready = !preparation || preparation.status === 'SUCCESS'

    if (isAborted() || !ready) {
      return Promise.resolve(false)
    }

    const values = page.commitValues()
    signal.removeEventListener('abort', dispose)
    update(values, loadAsyncComponents(page.assets), preparation?.status === 'SUCCESS')

    return nextTick().then(() => !signal.aborted)
  }

  return { prepare, commit }
}
