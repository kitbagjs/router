import { createUniqueIdSequence } from '@/services/createUniqueIdSequence'

export type NavigationIds = {
  getNavigationId: () => string,
  isCurrentNavigationId: (id: string) => boolean,
  stopNavigationIds: () => void,
}

export function createNavigationIds(): NavigationIds {
  const getNextId = createUniqueIdSequence()
  let currentId: string | undefined
  let stopped = false

  const getNavigationId: NavigationIds['getNavigationId'] = () => {
    currentId = getNextId()

    return currentId
  }

  const isCurrentNavigationId: NavigationIds['isCurrentNavigationId'] = (id) => {
    return !stopped && id === currentId
  }

  const stopNavigationIds: NavigationIds['stopNavigationIds'] = () => {
    stopped = true
  }

  return {
    getNavigationId,
    isCurrentNavigationId,
    stopNavigationIds,
  }
}
