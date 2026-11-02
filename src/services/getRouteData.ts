import { NavigationData } from '@/services/createRouterNavigation'
import { getComputations, isKind } from '@/services/getComputations'
import { toValueRecord } from '@/services/toValueRecord'
import { CallbackContextResponse } from '@/types/callbackContext'
import { NavigationAbandonedError } from '@/errors/navigationAbandonedError'
import { unwrapComputationResponse } from '@/utilities/unwrapComputationResponse'
import { DataRecord } from '@/types/data'
import { ResolvedRoute } from '@/types/resolved'

export function getRouteData(navigation: Pick<NavigationData, 'subscribe'>, route: ResolvedRoute): DataRecord {
  const loaders = getComputations(route).filter(isKind('loader'))

  return toValueRecord(loaders, (location) => {
    const value = toComponentValue(navigation.subscribe(location, route))

    value.catch(() => {})

    return value
  })
}

async function toComponentValue(response: Promise<CallbackContextResponse>): Promise<unknown> {
  try {
    return await response.then(unwrapComputationResponse)
  } catch (error) {
    if (error instanceof NavigationAbandonedError) {
      return new Promise<never>(() => {})
    }

    throw error
  }
}
