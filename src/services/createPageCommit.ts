import { nextTick } from 'vue'
import { Page } from '@/types/page'
import { RouteValueResponse, RouteValueResponses } from '@/services/createRouteValueStore'
import { DataKind } from '@/services/createNavigationStores'
import { loadAsyncComponents } from '@/utilities/components'
import { PageValues, emptyPageValues } from '@/services/createPageValues'
import { createPageStatus } from '@/services/createPageStatus'
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
  values?: PageValues,
  update: (values: RouteValueResponses, components: Promise<unknown>[], prepared: boolean) => void,
  settle: (response: Promise<RouteValueResponse>, source: DataKind) => Promise<RouteValueResponse>,
}

/** The same preparation and render boundary for every page, independent of how it was selected. */
export function createPageCommit({ page, signal, values = emptyPageValues, update, settle }: PageCommitOptions): PageCommit {
  const status = createPageStatus()

  const dispose = (): void => {
    status.set('abandoned')
    values.dispose()
    signal.removeEventListener('abort', dispose)
  }

  signal.addEventListener('abort', dispose, { once: true })

  const prepare: PageCommit['prepare'] = async () => {
    if (signal.aborted) {
      dispose()

      return { status: 'ABANDONED' }
    }

    status.set('preparing')
    try {
      const response = await Promise.race([prepareAssets(), createAbortPromise(signal)])

      if (!response || status.isAbandoned()) {
        dispose()

        return { status: 'ABANDONED' }
      }

      if (response.status !== 'SUCCESS') {
        dispose()

        return response
      }

      status.set('prepared')

      return response
    } catch (error) {
      dispose()
      throw error
    }
  }

  async function prepareAssets(): Promise<RouteValueResponse> {
    const preparedValues = prepareValues()
    const preparedComponents = prepareComponents()
    const response = await Promise.race([preparedValues, preparedComponents])

    if (response.status !== 'SUCCESS') {
      return response
    }

    const [valuesResponse] = await Promise.all([preparedValues, preparedComponents])

    return valuesResponse
  }

  async function prepareValues(): Promise<RouteValueResponse> {
    const valuesToPrepare = values.prepare()
    const props = settle(valuesToPrepare.props, 'props')
    const loaders = settle(valuesToPrepare.loaders, 'loader')
    const response = await Promise.race([props, loaders])

    if (response.status !== 'SUCCESS') {
      return response
    }

    const [propsResponse, loadersResponse] = await Promise.all([props, loaders])

    if (propsResponse.status !== 'SUCCESS') {
      return propsResponse
    }

    return loadersResponse
  }

  async function prepareComponents(): Promise<RouteValueResponse> {
    await Promise.all(loadAsyncComponents(page.assets))

    return { status: 'SUCCESS' }
  }

  const commit: PageCommit['commit'] = async () => {
    if (signal.aborted || status.isPreparing() || status.isAbandoned()) {
      return false
    }

    const responses = values.commit()
    signal.removeEventListener('abort', dispose)
    update(responses, loadAsyncComponents(page.assets), status.isPrepared())

    await nextTick()

    return !signal.aborted
  }

  return { prepare, commit }
}
