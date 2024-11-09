import { InvalidRouteUrlError } from '@/errors/invalidRouteUrlError'
import { getParamsForString } from '@/services/getParamsForString'
import { isUrl, Routes } from '@/types'

export function checkUrlAssemblesValidUrl(routes: Routes): void {
  for (const route of routes) {
    const params = getParamsForString(`${route.host}${route.path}`, {})

    if (Object.keys(params).length) {
      continue
    }

    const url = `${route.host.toString()}${route.path.toString()}`

    if (!isUrl(url)) {
      throw new InvalidRouteUrlError(route)
    }
  }
}
