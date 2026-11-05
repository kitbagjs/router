import { getRouteTitle } from '@/services/getRouteTitle'
import { getRouteLoaderLocation } from '@/services/getRouteLoaderLocation'
import { DEFAULT_VIEW_NAME } from '@/services/routeViews'
import { DEFAULT_LOADER_NAME } from '@/services/addLoader'
import { loaderLocations } from '@/services/loaderLocations'
import { propsLocations } from '@/services/propsLocations'
import { PropsCallbackParent } from '@/types/props'
import { ResolvedRoute } from '@/types/resolved'
import { RouteView } from '@/types/routeViews'
import { ValueLocation } from '@/types/computation'
import { toLegacyValues } from '@/utilities/toLegacyValues'

type GetCallbackParentOptions = {
  to: ResolvedRoute,
  getValue: (location: ValueLocation) => Promise<unknown>,
}

/**
 * The parent context for the callback at the given depth. Resolved per depth rather than from the last
 * match: every view in a nested route gets its own parent, not the resolved route's parent.
 */
export function getCallbackParent(depth: number, { to: route, getValue }: GetCallbackParentOptions): PropsCallbackParent {
  if (depth <= 0) {
    return
  }

  const parentMatch = route.matches[depth - 1]
  const { name: parentName = '' } = parentMatch

  function getData(name = DEFAULT_LOADER_NAME): Promise<unknown> {
    const location = getRouteLoaderLocation(route, name, route.matches.slice(0, depth))

    return getValue(location)
  }

  function getProps(name: string = DEFAULT_VIEW_NAME): Promise<unknown> {
    const view = parentMatch.views[name] as RouteView<unknown> | undefined

    if (!view?.props) {
      throw new TypeError(`Parent route "${parentName}" has no props getter named "${name}"`)
    }

    return getValue({ kind: 'props', depth: depth - 1, name })
  }

  function getTitle(): Promise<string | undefined> {
    return getRouteTitle(route, getValue, depth)
  }

  return {
    getTitle,
    name: parentName,
    getData,
    getProps,
    get props() {
      return toLegacyValues(propsLocations(parentMatch, depth - 1), getValue)
    },
    get data() {
      return toLegacyValues(loaderLocations(parentMatch, depth - 1), getValue)
    },
  }
}
