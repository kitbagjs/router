import { PropsGetter } from '@/types/createRouteOptions'
import type { PrefetchConfigs, PrefetchStrategy } from '@/types/prefetch'
import { getPrefetchOption } from '@/utilities/prefetch'
import { ResolvedRoute } from '@/types/resolved'
import { RouteViews } from '@/types/routeViews'
import { DEFAULT_VIEW_NAME, isWithBareViewProps, isWithViewProps } from './createRouteViews'
import { ContextPushError } from '@/errors/contextPushError'
import { ContextRejectionError } from '@/errors/contextRejectionError'
import { NavigationAbandonedError } from '@/errors/navigationAbandonedError'
import { PropsCallbackParent } from '@/types/props'
import { createVueAppStore, HasVueAppStore } from './createVueAppStore'
import { CallbackContextPush, CallbackContextReject, CallbackContextSuccess } from '@/types/callbackContext'
import { createRouterCallbackContext } from './createRouterCallbackContext'
import { createDataStore, DataStore } from './createDataStore'
import { createNavigationStores, getDataKey } from './createNavigationStores'
import { PropsResult } from '@/utilities/props'
import { MaybePromise } from '@/types/utilities'

type ViewProps = {
  id: string,
  name: string,
  depth: number,
  routePrefetch: PrefetchConfigs['routePrefetch'],
  viewPrefetch: PrefetchConfigs['viewPrefetch'],
  props?: PropsGetter,
}

/**
 * A navigation that was superseded before its props settled. The navigation that replaced it owns the
 * outcome, so this one reports that it went nowhere rather than a success it never had.
 */
type SetPropsAbandoned = {
  status: 'ABANDONED',
}

type SetPropsResponse = CallbackContextSuccess | CallbackContextPush | CallbackContextReject | SetPropsAbandoned

/**
 * A link's own bucket of prefetched props, handed to the current navigation when the link is followed and
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

export type PropStore = HasVueAppStore & {
  createPrefetchStore: () => PrefetchStore,
  setProps: (route: ResolvedRoute) => Promise<SetPropsResponse>,
  getProps: (id: string, name: string, route: ResolvedRoute) => MaybePromise<PropsResult>,
}

export function createPropStore(): PropStore {
  const { setVueApp, runWithContext } = createVueAppStore()
  const navigation = createNavigationStores()

  const createPrefetchStore: PropStore['createPrefetchStore'] = () => {
    const link = { store: createDataStore() }

    const dispose: PrefetchStore['dispose'] = () => {
      link.store.dispose(new NavigationAbandonedError())
    }

    const reset: PrefetchStore['reset'] = () => {
      dispose()
      link.store = createDataStore()
    }

    const prefetch: PrefetchStore['prefetch'] = (strategy, route, configs) => {
      for (const view of getViewProps(route).filter(hasGetter)) {
        const option = getPrefetchOption({
          ...configs,
          routePrefetch: view.routePrefetch,
          viewPrefetch: view.viewPrefetch,
        }, 'props')

        if (option !== strategy) {
          continue
        }

        link.store.set(getPropKey(view, route), () => runGetter(view, route, link.store))
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

  const setProps: PropStore['setProps'] = async (route) => {
    const previous = navigation.promote()
    const store = navigation.current()

    previous.dispose(new NavigationAbandonedError())

    const views = getViewProps(route).filter(hasGetter)
    const keys = views.map((view) => getPropKey(view, route))

    views.forEach((view, index) => {
      store.set(keys[index], () => runGetter(view, route))
    })

    try {
      await Promise.all(keys.map((key) => store.subscribe(key)))

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

  const getProps: PropStore['getProps'] = (id, name, route) => {
    const key = getDataKey(id, name, route)
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

  function runGetter(view: ViewProps & { props: PropsGetter }, route: ResolvedRoute, store?: DataStore): unknown {
    const { push, replace, reject, update } = createRouterCallbackContext({ to: route })

    return runWithContext(() => view.props(route, {
      push,
      replace,
      reject,
      update,
      parent: getParentContext(route, view.depth, store),
    }))
  }

  /**
   * The parent context for the view at the given depth. Resolved per depth rather than from the last
   * match: every view in a nested route gets its own parent, not the resolved route's parent.
   */
  function getParentContext(route: ResolvedRoute, depth: number, store?: DataStore): PropsCallbackParent {
    if (depth === 0) {
      return
    }

    const parentMatch = route.matches[depth - 1]
    const { views: parentViews, name: parentName = '' } = parentMatch

    if (isWithBareViewProps(parentViews)) {
      return {
        name: parentName,
        get props() {
          return getParentProps(parentMatch.id, DEFAULT_VIEW_NAME, route, store)
        },
      }
    }

    if (isWithViewProps(parentViews)) {
      return {
        name: parentName,
        props: new Proxy({}, {
          get(target, propName) {
            // a name with no getter is never computed, so waiting on it would never settle
            if (typeof propName !== 'string' || !(propName in parentViews) || !parentViews[propName].props) {
              return Reflect.get(target, propName)
            }

            return getParentProps(parentMatch.id, propName, route, store)
          },
        }),
      }
    }

    return {
      name: parentName,
      props: undefined,
    }
  }

  /**
   * A parent's props resolve from whichever arrives first, the prefetching this getter belongs to or the
   * navigation, so a getter never has to know which of the two will compute them.
   */
  function getParentProps(id: string, name: string, route: ResolvedRoute, store?: DataStore): Promise<unknown> {
    const key = getDataKey(id, name, route)

    if (!store) {
      return navigation.current().subscribe(key)
    }

    if (store.get(key).kind === 'missing' && navigation.current().get(key).kind === 'missing') {
      warnWaitingForParentProps(name, route)
    }

    const props = firstToArrive([
      store.subscribe(key),
      navigation.current().subscribe(key),
    ])

    // firstToArrive derives a new promise, so the handler the store attached does not cover it
    props.catch(() => {})

    return props
  }

  function getViewProps(route: ResolvedRoute): ViewProps[] {
    return route.matches.flatMap((match, depth) => viewsToProps(match.id, match.views, depth, match.prefetch))
  }

  function viewsToProps(id: string, views: RouteViews, depth: number, routePrefetch: PrefetchConfigs['routePrefetch']): ViewProps[] {
    return Object.entries(views).map(([name, view]) => ({
      id,
      name,
      depth,
      routePrefetch,
      viewPrefetch: view.prefetch,
      props: view.props as PropsGetter | undefined,
    }))
  }

  function getPropKey(view: ViewProps, route: ResolvedRoute): string {
    return getDataKey(view.id, view.name, route)
  }

  return {
    createPrefetchStore,
    setProps,
    getProps,
    setVueApp,
  }
}

/**
 * The first source to produce a value. Both failing surfaces a real getter error over an abandonment,
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

function hasGetter(view: ViewProps): view is ViewProps & { props: PropsGetter } {
  return Boolean(view.props)
}

function warnWaitingForParentProps(name: string, route: ResolvedRoute): void {
  const routeName = route.name || 'unknown'

  console.warn(`
    Waiting on parent props "${name}" while prefetching props for route "${routeName}".
    The parent's props are not being prefetched at this point, so these props cannot resolve until the
    parent's props are computed — either by the parent's own prefetch strategy or by navigating.
    Prefetch the parent's props with the same strategy to avoid stalling here.
  `)
}
