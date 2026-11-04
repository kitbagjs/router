import { getRouteLoaderLocation } from '@/services/getRouteLoaderLocation'
import { DEFAULT_VIEW_NAME } from '@/services/routeViews'
import { DEFAULT_LOADER_NAME } from '@/services/addLoader'
import { toLegacyValues } from '@/utilities/toLegacyValues'
import { LoaderDataAccessError } from '@/errors/loaderDataAccessError'
import { PropsCallbackParent } from '@/types/props'
import { ResolvedRoute } from '@/types/resolved'
import { Computation, ComputationContext, loaderLocations, propsLocations, tagsLocations, ValueLocation } from '@/services/getComputations'
import { createRouterCallbackContext } from '@/services/createRouterCallbackContext'
import { getDataKey } from '@/services/getDataKey'
import { PrefetchConfig } from '@/types/prefetch'
import { AnyPayloadTransformer } from '@/services/payload'
import { AnyFunction } from '@/types/utilities'
import { createTags } from '@/services/createTags'
import { isTags, TagLayer } from '@/types/tags'
import { isPromise } from '@/utilities/promises'
import { unwrapComputationResponse } from '@/utilities/unwrapComputationResponse'

type CreateRouteComputationOptions = {
  location: ValueLocation,
  route: ResolvedRoute,
  callback: AnyFunction,
  routePrefetch?: PrefetchConfig,
  prefetch?: PrefetchConfig,
  transformer?: AnyPayloadTransformer,
}

export function createRouteComputation({ location, route, callback, routePrefetch, prefetch, transformer }: CreateRouteComputationOptions): Computation {
  const run: Computation['run'] = (context) => {
    const { to, signal } = context
    const callbackRoute = toCallbackRoute(location, to, context)
    const parent = getParentContext(to, location.depth, context)

    if (location.kind === 'tags') {
      const tags = createTags({ getParentLayers: () => getParentTagLayers(to, location.depth, context) })

      if (!isTags(tags)) {
        throw new TypeError('Expected tags created by createTags')
      }

      const { operations } = tags
      const result = callback(tags, { to: callbackRoute, signal, parent })

      if (isPromise(result)) {
        return result.then(() => [...operations])
      }

      return [...operations]
    }

    const { push, replace, reject, update } = createRouterCallbackContext({ to })

    return callback(callbackRoute, { push, replace, reject, update, signal, parent })
  }

  const key = getDataKey({ ...location, route })
  const computation = {
    ...location,
    key,
    run,
    routePrefetch,
    prefetch,
    transformer,
  }

  return computation
}

async function getParentTagLayers(route: ResolvedRoute, depth: number, { subscribe }: ComputationContext): Promise<TagLayer[]> {
  const ancestors = route.matches.slice(0, depth).flatMap(tagsLocations)
  const responses = await Promise.all(ancestors.map((location) => subscribe(location)))
  const layers: TagLayer[] = []

  for (const response of responses) {
    if (response.status === 'ERROR') {
      continue
    }

    layers.push(unwrapComputationResponse(response) as TagLayer)
  }

  return layers
}

/**
 * Loaders cannot read their own route's data, which could create circular dependencies.
 * They can read parent data instead. Props callbacks read data from their computation store.
 * The proxy avoids subscribing to loader data until a callback calls route.getData().
 */
function toCallbackRoute({ kind, name }: ValueLocation, route: ResolvedRoute, { getValue }: ComputationContext): ResolvedRoute {
  function getData(name = DEFAULT_LOADER_NAME): Promise<unknown> {
    const location = getRouteLoaderLocation(route, name)

    return getValue(location)
  }

  return new Proxy(route, {
    get(target, property, receiver) {
      if (property !== 'data' && property !== 'getData') {
        return Reflect.get(target, property, receiver)
      }

      if (kind === 'loader') {
        throw new LoaderDataAccessError(name)
      }

      if (property === 'data') {
        const loaders = route.matches.flatMap(loaderLocations)
        return toLegacyValues(loaders, getValue)
      }

      return getData
    },
  })
}

/**
 * The parent context for the callback at the given depth. Resolved per depth rather than from the last
 * match: every view in a nested route gets its own parent, not the resolved route's parent.
 */
function getParentContext(route: ResolvedRoute, depth: number, { getValue }: ComputationContext): PropsCallbackParent {
  if (depth <= 0) {
    return
  }

  const parentMatch = route.matches[depth - 1]
  const { name: parentName = '' } = parentMatch

  return {
    name: parentName,
    getData(name = DEFAULT_LOADER_NAME) {
      const location = getRouteLoaderLocation(route, name, route.matches.slice(0, depth))

      return getValue(location)
    },
    getProps(name: string = DEFAULT_VIEW_NAME) {
      const view = parentMatch.views[name]

      if (!Object.hasOwn(parentMatch.views, name) || !view.props) {
        throw new TypeError(`Parent route "${parentName}" has no props getter named "${name}"`)
      }

      return getValue({ kind: 'props', depth: depth - 1, name })
    },
    get props() {
      return toLegacyValues(propsLocations(parentMatch, depth - 1), getValue)
    },
    get data() {
      return toLegacyValues(loaderLocations(parentMatch, depth - 1), getValue)
    },
  }
}
