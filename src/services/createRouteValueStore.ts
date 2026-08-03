import { markRaw } from 'vue'
import { PropsGetter } from '@/types/createRouteOptions'
import type { PrefetchConfig, PrefetchConfigs, PrefetchStrategy } from '@/types/prefetch'
import { getPrefetchOption } from '@/utilities/prefetch'
import { ResolvedRoute, ResolvedRouteWithData } from '@/types/resolved'
import { CreatedRouteOptions } from '@/types/route'
import { DEFAULT_VIEW_NAME, viewNamesWithProps } from './createRouteViews'
import { DEFAULT_LOADER_NAME } from './addLoader'
import { ContextPushError } from '@/errors/contextPushError'
import { LoaderDataAccessError } from '@/errors/loaderDataAccessError'
import { ContextRejectionError } from '@/errors/contextRejectionError'
import { NavigationAbandonedError } from '@/errors/navigationAbandonedError'
import { PropsCallbackParent } from '@/types/props'
import { createVueAppStore, HasVueAppStore } from './createVueAppStore'
import { CallbackContextPush, CallbackContextReject, CallbackContextSuccess } from '@/types/callbackContext'
import { createRouterCallbackContext } from './createRouterCallbackContext'
import { createDataStore, DataStore } from './createDataStore'
import { createNavigationStores, DataKind, getDataKey } from './createNavigationStores'
import { PropsResult } from '@/utilities/props'
import { AnyFunction, MaybePromise } from '@/types/utilities'

/**
 * Something a route computes: a view's props getter, or a loader. Both are a named callback belonging to
 * one match, so both are stored the same way — what differs is only what waits on them.
 */
type Computation = {
  kind: DataKind,
  id: string,
  name: string,
  depth: number,
  key: string,
  run: AnyFunction,
  routePrefetch: PrefetchConfig | undefined,
  prefetch: PrefetchConfig | undefined,
}

/**
 * Where a value lives, which is all that is needed to read it back out of a store.
 */
type ValueLocation = {
  kind: DataKind,
  id: string,
  name: string,
}

/**
 * A navigation that was superseded before its values settled. The navigation that replaced it owns the
 * outcome, so this one reports that it went nowhere rather than a success it never had.
 */
type RouteValueAbandoned = {
  status: 'ABANDONED',
}

export type RouteValueResponse = CallbackContextSuccess | CallbackContextPush | CallbackContextReject | RouteValueAbandoned

/**
 * How a navigation's props and loaders settled. Reported separately because props are what a view renders
 * with while loaders hold nothing up, so a slow loader must not be what decides when props are known.
 */
export type RouteValueResponses = {
  props: Promise<RouteValueResponse>,
  loaders: Promise<RouteValueResponse>,
}

/**
 * A link's own bucket of prefetched values, handed to the current navigation when the link is followed and
 * discarded otherwise.
 */
export type PrefetchStore = {
  prefetch: (strategy: PrefetchStrategy, route: ResolvedRoute, configs: PrefetchConfigs) => void,
  commit: () => void,
  /**
   * Abandons what was prefetched and starts over, for a link that now points somewhere else.
   */
  reset: () => void,
  /**
   * Abandons what was prefetched, for a link that is gone.
   */
  dispose: () => void,
}

export type RouteValueStore = HasVueAppStore & {
  createPrefetchStore: () => PrefetchStore,
  setRouteValues: (route: ResolvedRoute) => RouteValueResponses,
  getProps: (id: string, name: string, route: ResolvedRoute) => MaybePromise<PropsResult>,
  /**
   * What a route exposes as `data`. Resolved per read rather than captured, so it stays correct as
   * navigations replace the store its values live in.
   */
  getData: (route: ResolvedRoute) => ResolvedRouteWithData['data'],
}

export function createRouteValueStore(): RouteValueStore {
  const { setVueApp, runWithContext } = createVueAppStore()
  const navigation = createNavigationStores()

  const createPrefetchStore: RouteValueStore['createPrefetchStore'] = () => {
    const link = { store: createDataStore() }

    const dispose: PrefetchStore['dispose'] = () => {
      link.store.dispose(new NavigationAbandonedError())
    }

    const reset: PrefetchStore['reset'] = () => {
      dispose()
      link.store = createDataStore()
    }

    const prefetch: PrefetchStore['prefetch'] = (strategy, route, configs) => {
      for (const computation of getComputations(route).filter(isKind('props'))) {
        const option = getPrefetchOption({
          ...configs,
          routePrefetch: computation.routePrefetch,
          viewPrefetch: computation.prefetch,
        }, 'props')

        if (option !== strategy) {
          continue
        }

        link.store.set(computation.key, () => run(computation, route, link.store))
      }
    }

    const commit: PrefetchStore['commit'] = () => {
      navigation.stage(link.store)
      link.store = createDataStore()
    }

    return {
      prefetch,
      commit,
      reset,
      dispose,
    }
  }

  const setRouteValues: RouteValueStore['setRouteValues'] = (route) => {
    const previous = navigation.promote()
    const store = navigation.current()

    previous.dispose(new NavigationAbandonedError())

    const computations = getComputations(route)

    return {
      props: compute(store, route, computations.filter(isKind('props'))),
      loaders: compute(store, route, computations.filter(isKind('loader'))),
    }
  }

  /**
   * Sets every computation into the navigation's store and reports how they settled. Setting happens
   * before the first await, so everything a route computes is under way by the time the route is current.
   */
  async function compute(store: DataStore, route: ResolvedRoute, computations: Computation[]): Promise<RouteValueResponse> {
    computations.forEach((computation) => {
      store.set(computation.key, () => run(computation, route))
    })

    try {
      await Promise.all(computations.map(({ key }) => store.subscribe(key)))

      return { status: 'SUCCESS' }
    } catch (error) {
      if (error instanceof NavigationAbandonedError) {
        return { status: 'ABANDONED' }
      }

      if (error instanceof ContextPushError) {
        return error.response
      }

      if (error instanceof ContextRejectionError) {
        return error.response
      }

      throw error
    }
  }

  const getProps: RouteValueStore['getProps'] = (id, name, route) => {
    const key = getDataKey('props', id, name, route)
    const result = navigation.current().get(key)

    switch (result.kind) {
      case 'missing':
        return NO_PROPS

      case 'pending':
      case 'running':
        return toResult(navigation.current().subscribe(key))

      case 'value':
      case 'error':
        return result
    }
  }

  function getData(route: ResolvedRoute, store?: DataStore): ResolvedRouteWithData['data'] {
    const loaders = getComputations(route).filter(isKind('loader'))

    return toValues(loaders, DEFAULT_LOADER_NAME, route, store)
  }

  function run(computation: Computation, route: ResolvedRoute, store?: DataStore): unknown {
    const { push, replace, reject, update } = createRouterCallbackContext({ to: route })

    return runWithContext(() => computation.run(toCallbackRoute(computation, route, store), {
      push,
      replace,
      reject,
      update,
      parent: getParentContext(route, computation.depth, store),
    }))
  }

  /**
   * The route a callback is given, which is the resolved route with its data answering to whoever reads it.
   *
   * A props getter sees the route's data, since a view is entitled to render with what the route loaded.
   * A loader sees none of it: its own route's data includes what it is computing, so reading it could only
   * wait on itself, or on a sibling waiting back. Loaders reach other routes' data through the parent
   * context, which only ever points upward — that is what makes it impossible to arrange callbacks that
   * wait on each other.
   *
   * A proxy rather than a copy so that the data the route already carries is read only when it is asked
   * for. Copying would read it to carry it over, subscribing to a value nothing asked for.
   */
  function toCallbackRoute({ kind, name }: Computation, route: ResolvedRoute, store?: DataStore): ResolvedRoute {
    return new Proxy(route, {
      get(target, property, receiver) {
        if (property !== 'data') {
          return Reflect.get(target, property, receiver)
        }

        if (kind === 'loader') {
          throw new LoaderDataAccessError(name)
        }

        // computing for a link resolves data against that link's store as well as the navigation's, so a
        // getter does not have to know which of the two will compute what it reads
        return getData(route, store)
      },
    })
  }

  /**
   * The parent context for the callback at the given depth. Resolved per depth rather than from the last
   * match: every view in a nested route gets its own parent, not the resolved route's parent.
   */
  function getParentContext(route: ResolvedRoute, depth: number, store?: DataStore): PropsCallbackParent {
    if (depth === 0) {
      return
    }

    const parentMatch = route.matches[depth - 1]
    const { name: parentName = '' } = parentMatch

    return {
      name: parentName,
      get props() {
        return toValues(propsLocations(parentMatch), DEFAULT_VIEW_NAME, route, store)
      },
      get data() {
        return toValues(loaderLocations(parentMatch), DEFAULT_LOADER_NAME, route, store)
      },
    }
  }

  /**
   * A set of named values as a callback or component sees them. A lone unnamed value is given directly,
   * matching how it was written, and named values sit behind a proxy so only what is read is waited on.
   */
  function toValues(locations: ValueLocation[], bareName: string, route: ResolvedRoute, store?: DataStore): ResolvedRouteWithData['data'] {
    if (locations.length === 0) {
      return undefined
    }

    const [only] = locations

    if (locations.length === 1 && only.name === bareName) {
      return getValue(only, route, store)
    }

    const find = (property: string | symbol): ValueLocation | undefined => locations.find(({ name }) => name === property)

    const values: Record<string, Promise<unknown>> = {}

    return markRaw(new Proxy(values, {
      get(target, property) {
        const location = find(property)

        return location ? getValue(location, route, store) : Reflect.get(target, property)
      },
      has(target, property) {
        return Boolean(find(property)) || Reflect.has(target, property)
      },
      ownKeys() {
        return locations.map(({ name }) => name)
      },
      getOwnPropertyDescriptor(target, property) {
        const location = find(property)

        if (!location) {
          return Reflect.getOwnPropertyDescriptor(target, property)
        }

        return {
          configurable: true,
          enumerable: true,
          value: getValue(location, route, store),
        }
      },
    }))
  }

  /**
   * A value resolves from whichever arrives first, the prefetching the reader belongs to or the
   * navigation, so a reader never has to know which of the two will compute it.
   */
  function getValue(location: ValueLocation, route: ResolvedRoute, store?: DataStore): Promise<unknown> {
    const key = getDataKey(location.kind, location.id, location.name, route)

    if (!store) {
      return navigation.current().subscribe(key)
    }

    if (store.get(key).kind === 'missing' && navigation.current().get(key).kind === 'missing') {
      warnWaitingWhilePrefetching(location, route)
    }

    const value = firstToArrive([
      store.subscribe(key),
      navigation.current().subscribe(key),
    ])

    // firstToArrive derives a new promise, so the handler the store attached does not cover it
    value.catch(() => {})

    return value
  }

  function getComputations(route: ResolvedRoute): Computation[] {
    return route.matches.flatMap((match, depth) => [
      ...propsLocations(match).map((location) => toComputation(location, match, depth, route, match.views[location.name].props as PropsGetter, match.views[location.name].prefetch)),
      ...loaderLocations(match).map((location) => toComputation(location, match, depth, route, match.loaders[location.name].load, match.loaders[location.name].prefetch)),
    ])
  }

  function toComputation(location: ValueLocation, match: CreatedRouteOptions, depth: number, route: ResolvedRoute, run: AnyFunction, prefetch: PrefetchConfig | undefined): Computation {
    return {
      ...location,
      depth,
      key: getDataKey(location.kind, location.id, location.name, route),
      run,
      routePrefetch: match.prefetch,
      prefetch,
    }
  }

  return {
    createPrefetchStore,
    setRouteValues,
    getProps,
    getData,
    setVueApp,
  }
}

/**
 * Only views with a getter, since a view with none is never computed and waiting on it would never settle.
 */
function propsLocations(match: CreatedRouteOptions): ValueLocation[] {
  return viewNamesWithProps(match.views).map((name) => ({ kind: 'props', id: match.id, name }))
}

function loaderLocations(match: CreatedRouteOptions): ValueLocation[] {
  return Object.keys(match.loaders).map((name) => ({ kind: 'loader', id: match.id, name }))
}

function isKind(kind: DataKind): (computation: Computation) => boolean {
  return (computation) => computation.kind === kind
}

/**
 * The first source to produce a value. Both failing surfaces a real callback error over an abandonment,
 * since abandonment only says nobody is computing that source any more.
 */
async function firstToArrive(sources: Promise<unknown>[]): Promise<unknown> {
  try {
    return await Promise.any(sources)
  } catch (error) {
    if (error instanceof AggregateError) {
      throw error.errors.find((reason) => !(reason instanceof NavigationAbandonedError)) ?? error.errors[0]
    }

    throw error
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
async function toResult(props: Promise<unknown>): Promise<PropsResult> {
  try {
    return { kind: 'value', value: await props }
  } catch (error) {
    return { kind: 'error', error }
  }
}

function warnWaitingWhilePrefetching({ kind, name }: ValueLocation, route: ResolvedRoute): void {
  const routeName = route.name || 'unknown'
  const value = kind === 'props' ? `props "${name}"` : `loader data "${name}"`

  console.warn(`
    Waiting on ${value} while prefetching for route "${routeName}".
    It is not being prefetched at this point, so it cannot resolve until it is computed — either by its
    own prefetch strategy or by navigating. Prefetch it with the same strategy to avoid stalling here.
  `)
}
