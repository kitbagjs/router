import { DEFAULT_LOADER_NAME } from '@/services/addLoader'
import { getRouteLoaderLocation } from '@/services/getRouteLoaderLocation'
import { loaderLocations } from '@/services/getComputations'
import { ComputationContext } from '@/types/computation'
import { ResolvedRoute, WithData } from '@/types/resolved'
import { toLegacyValues } from '@/utilities/toLegacyValues'

/** Defers data access until the callback reads it, using that computation's navigation readers. */
export function createCallbackRoute({ to, getValue }: ComputationContext): ResolvedRoute & WithData {
  function getData(name = DEFAULT_LOADER_NAME): Promise<unknown> {
    const location = getRouteLoaderLocation(to, name)

    return getValue(location)
  }

  const route = {
    ...to,
    getData,
    get data() {
      const loaders = to.matches.flatMap(loaderLocations)

      return toLegacyValues(loaders, getValue)
    },
  }

  return route
}
