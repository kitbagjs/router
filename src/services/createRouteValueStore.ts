import { markRaw } from 'vue'
import { ResolvedRoute, WithData } from '@/types/resolved'
import { DEFAULT_VIEW_NAME } from './createRouteViews'
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
import { MaybePromise } from '@/types/utilities'
import { Computation, ComputationFilter, getComputations, isKind, loaderLocations, propsLocations, ValueLocation } from './getComputations'

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
  /**
   * Each value on its own as it settles, for whoever counts them.
   */
  values: Promise<unknown>[],
}

/**
 * A store of a route's values, whichever store that is.
 */
export type ValueStore = {
  /**
   * Computes the route's values, or only those the filter keeps, and reports how they settle.
   */
  compute: (route: ResolvedRoute, filter?: ComputationFilter) => RouteValueResponses,
  /**
   * Adopts values that already settled, in place of running their getters.
   */
  fill: (route: ResolvedRoute, values: RouteValue[]) => void,
}

/**
 * A store kept apart from the navigation until it is staged, so values can be computed ahead of a
 * navigation that may never come.
 */
export type DetachedStore = ValueStore & {
  /**
   * Becomes the staged store, replacing whatever was staged, and starts over empty.
   */
  stage: () => void,
  /**
   * Abandons what was computed and starts over.
   */
  reset: () => void,
  /**
   * Abandons what was computed.
   */
  dispose: () => void,
}

/**
 * A value the store holds for a route: which computation it belongs to, and what it resolved to.
 */
export type RouteValue = {
  kind: DataKind,
  depth: number,
  name: string,
  value: unknown,
}

export type RouteValueStore = HasVueAppStore & {
  createDetachedStore: () => DetachedStore,
  /**
   * The store the next navigation adopts, created when nothing is staged. Values computed into it ahead of
   * the navigation are found under way when the navigation commits, while the rendered route keeps reading
   * its own store meanwhile.
   */
  staged: () => ValueStore,
  /**
   * Makes the staged store current and computes whatever the route still lacks.
   */
  commit: (route: ResolvedRoute) => RouteValueResponses,
  /**
   * The values currently settled in the store.
   */
  getValues: (route: ResolvedRoute) => RouteValue[],
  getProps: (id: string, name: string, route: ResolvedRoute) => MaybePromise<PropsResult>,
  /**
   * What a route exposes as `data`. Resolved per read rather than captured, so it stays correct as
   * navigations replace the store its values live in.
   */
  getData: (route: ResolvedRoute) => WithData['data'],
}

export function createRouteValueStore(): RouteValueStore {
  const { setVueApp, runWithContext } = createVueAppStore()
  const navigation = createNavigationStores()

  const createDetachedStore: RouteValueStore['createDetachedStore'] = () => {
    const detached = { store: createDataStore() }

    const dispose: DetachedStore['dispose'] = () => {
      detached.store.dispose(new NavigationAbandonedError())
    }

    const reset: DetachedStore['reset'] = () => {
      dispose()
      detached.store = createDataStore()
    }

    const stage: DetachedStore['stage'] = () => {
      navigation.stage(detached.store)
      detached.store = createDataStore()
    }

    return {
      ...createValueStore(() => detached.store),
      stage,
      reset,
      dispose,
    }
  }

  const staged: RouteValueStore['staged'] = () => {
    return createValueStore(() => navigation.staged())
  }

  const commit: RouteValueStore['commit'] = (route) => {
    const previous = navigation.promote()

    previous.dispose(new NavigationAbandonedError())

    return createValueStore(() => navigation.current()).compute(route)
  }

  /**
   * The same api over any store. The store is looked up per call, since a detached store starts over when
   * it is staged or reset.
   */
  function createValueStore(getStore: () => DataStore): ValueStore {
    const compute: ValueStore['compute'] = (route, filter = () => true) => {
      const store = getStore()
      const computations = getComputations(route).filter(filter)

      // loaders first, so a props getter reading the route's data finds it under way rather than missing
      const loaders = settle(store, route, computations.filter(isKind('loader')))
      const props = settle(store, route, computations.filter(isKind('props')))

      // a caller that does not wait on these must not see a getter's error as an unhandled rejection
      loaders.catch(() => {})
      props.catch(() => {})

      const values = computations.map(({ key }) => store.subscribe(key))

      return {
        props,
        loaders,
        values,
      }
    }

    const fill: ValueStore['fill'] = (route, values) => {
      const store = getStore()
      const computations = getComputations(route)

      for (const { kind, depth, name, value } of values) {
        const computation = computations.find((computation) => computation.kind === kind && computation.depth === depth && computation.name === name)

        if (!computation) {
          continue
        }

        store.set(computation.key, () => value)
      }
    }

    return {
      compute,
      fill,
    }
  }

  const getValues: RouteValueStore['getValues'] = (route) => {
    const store = navigation.current()

    return getComputations(route).flatMap(({ kind, depth, name, key }) => {
      const result = store.get(key)

      if (result.kind !== 'value') {
        return []
      }

      return [{ kind, depth, name, value: result.value }]
    })
  }

  /**
   * Sets every computation into the store and reports how they settled. Setting happens before the first
   * await, so everything a route computes is under way by the time the route is current. Getters read
   * from the same store, so one finds what a sibling is computing alongside it.
   */
  async function settle(store: DataStore, route: ResolvedRoute, computations: Computation[]): Promise<RouteValueResponse> {
    computations.forEach((computation) => {
      store.set(computation.key, () => run(computation, route, store))
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
      default:
        return result satisfies never
    }
  }

  function getData(route: ResolvedRoute, store?: DataStore): WithData['data'] {
    const loaders = getComputations(route).filter(isKind('loader'))

    return toValues(loaders, DEFAULT_LOADER_NAME, route, store)
  }

  function run(computation: Computation, route: ResolvedRoute, store: DataStore): unknown {
    const { push, replace, reject, update } = createRouterCallbackContext({ to: route })

    return runWithContext(() => computation.run(toCallbackRoute(computation, route, store), {
      push,
      replace,
      reject,
      update,
      signal: store.signal,
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

        // computing into a store that is not yet current resolves data against it as well as the
        // navigation's, so a getter does not have to know which of the two will compute what it reads
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
  function toValues(locations: ValueLocation[], bareName: string, route: ResolvedRoute, store?: DataStore): WithData['data'] {
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
   * A value resolves from whichever arrives first, the store the reader belongs to or the navigation, so
   * a reader never has to know which of the two will compute it.
   */
  function getValue(location: ValueLocation, route: ResolvedRoute, store?: DataStore): Promise<unknown> {
    const key = getDataKey(location.kind, location.id, location.name, route)
    const current = navigation.current()

    if (!store || store === current) {
      return current.subscribe(key)
    }

    if (store.get(key).kind === 'missing' && current.get(key).kind === 'missing') {
      warnWaitingOnUncomputedValue(location, route)
    }

    const value = firstToArrive([
      store.subscribe(key),
      navigation.current().subscribe(key),
    ])

    // firstToArrive derives a new promise, so the handler the store attached does not cover it
    value.catch(() => {})

    return value
  }

  return {
    createDetachedStore,
    staged,
    commit,
    getValues,
    getProps,
    getData,
    setVueApp,
  }
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
    if (error instanceof NavigationAbandonedError) {
      return NO_PROPS
    }

    return { kind: 'error', error }
  }
}

function warnWaitingOnUncomputedValue({ kind, name }: ValueLocation, route: ResolvedRoute): void {
  const routeName = route.name || 'unknown'
  const value = kind === 'props' ? `props "${name}"` : `loader data "${name}"`

  console.warn(`
    Waiting on ${value} for route "${routeName}" before anything is computing it.
    It cannot resolve until it is computed — by its own prefetch strategy, or by navigating. When
    prefetching, prefetch it with the same strategy to avoid stalling here.
  `)
}
