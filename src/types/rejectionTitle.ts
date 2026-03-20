import { ResolvedRoute } from '@/types/resolved'
import { MaybePromise } from '@/types/utilities'

export type SetRejectionTitleContext = {
  to: ResolvedRoute | null,
  from: ResolvedRoute | null,
}

export type SetRejectionTitleCallback = (context: SetRejectionTitleContext) => MaybePromise<string>
export type GetRejectionTitle = (context: SetRejectionTitleContext) => Promise<string | undefined>
export type SetRejectionTitle = (callback: SetRejectionTitleCallback) => void

export type RejectionSetTitle = {
  /**
   * Adds a callback to set the document title for the rejection.
   */
  setTitle: SetRejectionTitle,
}

type CreateRejectionTitle = {
  setTitle: SetRejectionTitle,
  getTitle: GetRejectionTitle,
}

export function createRejectionTitle(): CreateRejectionTitle {
  let setTitleCallback: SetRejectionTitleCallback | undefined

  const setTitle: SetRejectionTitle = (callback) => {
    setTitleCallback = callback
  }

  const getTitle: GetRejectionTitle = async (context) => {
    return setTitleCallback?.(context)
  }

  return {
    setTitle,
    getTitle,
  }
}
