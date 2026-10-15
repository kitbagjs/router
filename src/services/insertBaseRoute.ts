import { isRoute, Route } from '@/types/route'
import { stringHasValue } from '@/utilities/guards'
import { createUrl } from '@/services/createUrl'
import { combineUrl } from '@/services/combineUrl'

export function insertBaseRoute<T extends Route>(route: T, base?: string): T {
  if (!isRoute(route)) {
    throw new Error('insertBaseRoute called with an invalid route')
  }

  if (!stringHasValue(base)) {
    return route
  }

  const baseUrl = createUrl({ path: base })
  const aliases = route.aliases.map((alias) => ({
    ...alias,
    url: combineUrl(baseUrl, alias.url),
  }))

  return {
    ...route,
    ...combineUrl(baseUrl, route),
    aliases,
  }
}
