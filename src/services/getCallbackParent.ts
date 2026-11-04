import { getRouteLoaderLocation } from '@/services/getRouteLoaderLocation'
import { DEFAULT_VIEW_NAME } from '@/services/routeViews'
import { DEFAULT_LOADER_NAME } from '@/services/addLoader'
import { loaderLocations, propsLocations } from '@/services/getComputations'
import { PropsCallbackParent } from '@/types/props'
import { ComputationContext } from '@/types/computation'
import { toLegacyValues } from '@/utilities/toLegacyValues'

/**
 * The parent context for the callback at the given depth. Resolved per depth rather than from the last
 * match: every view in a nested route gets its own parent, not the resolved route's parent.
 */
export function getCallbackParent(depth: number, { to: route, getValue }: ComputationContext): PropsCallbackParent {
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
    const view = parentMatch.views[name]

    if (!Object.hasOwn(parentMatch.views, name) || !view.props) {
      throw new TypeError(`Parent route "${parentName}" has no props getter named "${name}"`)
    }

    return getValue({ kind: 'props', depth: depth - 1, name })
  }

  return {
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
