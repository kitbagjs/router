import { ValueLocation } from '@/types/computation'
import { NavigationData } from '@/services/createRouterNavigation'
import { loaderLocations } from '@/services/getComputations'
import { NavigationAbandonedError } from '@/errors/navigationAbandonedError'
import { LegacyValues, toLegacyValues } from '@/utilities/toLegacyValues'
import { ResolvedRoute } from '@/types/resolved'

export function getRouteData(navigation: Pick<NavigationData, 'getValue'>, route: ResolvedRoute): LegacyValues {
  const loaders = route.matches.flatMap(loaderLocations)
  const getValue = (location: ValueLocation): Promise<unknown> => {
    const value = navigation.getValue(location, route).catch((error: unknown) => {
      if (error instanceof NavigationAbandonedError) {
        return new Promise<never>(() => {})
      }

      throw error
    })

    value.catch(() => {})

    return value
  }

  return toLegacyValues(loaders, getValue)
}
