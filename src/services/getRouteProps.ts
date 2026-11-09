import { ValueLocation } from '@/types/computation'
import { NavigationData } from '@/services/createRouterNavigation'
import { ResolvedRoute } from '@/types/resolved'
import { CallbackContextResponse } from '@/types/callbackContext'
import { PropsResponse, PropsResult } from '@/utilities/props'
import { unwrapComputationResponse } from '@/utilities/unwrapComputationResponse'

type RoutePropsLocation = {
  depth: number,
  name: string,
}

export function getRouteProps(store: NavigationData, { depth, name }: RoutePropsLocation, route: ResolvedRoute): PropsResponse {
  if (depth < 0) {
    return NO_PROPS
  }

  const match = route.matches.at(depth)

  if (!match?.views[name]?.props) {
    return NO_PROPS
  }

  const location: ValueLocation<'props'> = { kind: 'props', depth, name }
  const result = store.getState(location, route)

  switch (result.status) {
    case 'MISSING':
      return NO_PROPS

    case 'PENDING':
    case 'RUNNING':
      return toResult(store, location, route)

    case 'ABANDONED':
      return { kind: 'abandoned' }

    case 'SUCCESS':
    case 'ERROR':
    case 'PUSH':
    case 'REJECT':
      return toPropsResult(result)
    default:
      return result satisfies never
  }
}

/**
 * What a view with no props getter renders with, since such a view stores nothing.
 */
const NO_PROPS: PropsResult = { kind: 'value', value: undefined }

/**
 * The render layer expects every outcome as a value it can inspect, so a rejection is folded back into a
 * result rather than being handed on as one.
 */
async function toResult(store: NavigationData, location: ValueLocation<'props'>, route: ResolvedRoute): Promise<PropsResult> {
  try {
    return toPropsResult(await store.subscribe(location, route))
  } catch (error) {
    const result = store.getState(location, route)

    if (result.status === 'ABANDONED') {
      return { kind: 'abandoned' }
    }

    throw error
  }
}

function toPropsResult(response: CallbackContextResponse): PropsResult {
  if (response.status === 'PUSH' || response.status === 'REJECT') {
    return { kind: 'abandoned' }
  }

  try {
    return { kind: 'value', value: unwrapComputationResponse(response) }
  } catch (error) {
    return { kind: 'error', error }
  }
}
