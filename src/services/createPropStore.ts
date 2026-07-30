import { effectScope, reactive, watch, WatchHandle } from 'vue'
import { PropsGetter } from '@/types/createRouteOptions'
import type { PrefetchConfigs, PrefetchStrategy } from '@/types/prefetch'
import { getPrefetchOption } from '@/utilities/prefetch'
import { ResolvedRoute } from '@/types/resolved'
import { RouteViews } from '@/types/routeViews'
import { DEFAULT_VIEW_NAME } from './createRouteViews'
import { ContextPushError } from '@/errors/contextPushError'
import { ContextRejectionError } from '@/errors/contextRejectionError'
import { ParentPropsAbandonedError } from '@/errors/parentPropsAbandonedError'
import { getPropsValue, PropsResult } from '@/utilities/props'
import { PropsCallbackParent } from '@/types/props'
import { MaybePromise } from '@/types/utilities'
import { createVueAppStore, HasVueAppStore } from './createVueAppStore'
import { CallbackContextPush, CallbackContextReject, CallbackContextSuccess } from '@/types/callbackContext'
import { createRouterCallbackContext } from './createRouterCallbackContext'

type ComponentProps = { id: string, name: string, depth: number, props?: PropsGetter }

type Waiter = { stop: WatchHandle, abandon: () => void }

type SetPropsResponse = CallbackContextSuccess | CallbackContextPush | CallbackContextReject

type StoredProps = MaybePromise<PropsResult>

export type PropStore = HasVueAppStore & {
  getPrefetchProps: (strategy: PrefetchStrategy, route: ResolvedRoute, configs: PrefetchConfigs, prefetched?: Record<string, StoredProps>) => Record<string, StoredProps>,
  setPrefetchProps: (props: Record<string, StoredProps>) => void,
  setProps: (route: ResolvedRoute) => Promise<SetPropsResponse>,
  getProps: (id: string, name: string, route: ResolvedRoute) => StoredProps,
}

/**
 * What a view with no props getter renders with, since such a view stores nothing.
 */
const NO_PROPS: PropsResult = { kind: 'value', value: undefined }

export function createPropStore(): PropStore {
  const { setVueApp, runWithContext } = createVueAppStore()
  const store: Map<string, StoredProps> = reactive(new Map())
  const waiters = new Map<string, Set<Waiter>>()

  /**
   * Detached because waiters outlive the component whose prefetch created them.
   */
  const waiterScope = effectScope(true)

  /**
   * Seeded with props already prefetched at earlier strategies, which are not in the store until commit.
   */
  const getPrefetchProps: PropStore['getPrefetchProps'] = (strategy, route, prefetch, prefetched = {}) => {
    const { push, replace, reject, update } = createRouterCallbackContext({ to: route })

    return route.matches
      .map((match, index) => ({ match, views: route.views[index], depth: index }))
      .flatMap(({ match, views, depth }) => getComponentProps(match.id, views, depth).map((componentProps) => ({ match, views, componentProps })))
      .filter(({ match, views, componentProps }) => getPrefetchOption({
        ...prefetch,
        routePrefetch: match.prefetch,
        viewPrefetch: views[componentProps.name].prefetch,
      }, 'props') === strategy)
      .map(({ componentProps }) => componentProps)
      .reduce<Record<string, StoredProps>>((response, { id, name, depth, props }) => {
        if (!props) {
          return response
        }

        const key = getPropKey(id, name, route)
        const value = runWithContext(() => getPropsValue(() => props(route, {
          push,
          replace,
          reject,
          update,
          parent: getParentContext(route, depth, true, response),
        })))

        response[key] = value

        return response
      }, { ...prefetched })
  }

  const setPrefetchProps: PropStore['setPrefetchProps'] = (props) => {
    Object.entries(props).forEach(([key, value]) => {
      store.set(key, value)
    })
  }

  const setProps: PropStore['setProps'] = async (route) => {
    const { push, replace, reject, update } = createRouterCallbackContext({ to: route })
    const componentProps = route.views.flatMap((views, depth) => getComponentProps(route.matches[depth].id, views, depth))
    const keys: string[] = []
    const promises: Promise<unknown>[] = []

    for (const { id, name, depth, props } of componentProps) {
      if (!props) {
        continue
      }

      const key = getPropKey(id, name, route)

      keys.push(key)

      if (!store.has(key)) {
        const value = runWithContext(() => getPropsValue(() => props(route, {
          push,
          replace,
          reject,
          update,
          parent: getParentContext(route, depth),
        })))

        store.set(key, value)
      }

      promises.push((async () => {
        const result = await store.get(key)

        if (result?.kind === 'error') {
          throw result.error
        }
      })())
    }

    clearUnusedStoreEntries(keys)

    try {
      await Promise.all(promises)

      return { status: 'SUCCESS' }
    } catch (error) {
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
    const key = getPropKey(id, name, route)

    return store.get(key) ?? NO_PROPS
  }

  /**
   * The parent context for the view at the given depth. Must be resolved per depth rather than from the
   * end of the tuples: every view in a nested route gets its own parent, not the resolved route's parent.
   */
  function getParentContext(route: ResolvedRoute, depth: number, prefetch: boolean = false, pending?: Record<string, StoredProps>): PropsCallbackParent {
    if (depth === 0) {
      return
    }

    const parentMatch = route.matches[depth - 1]
    const parentViews = route.views[depth - 1]

    const name = parentMatch.name ?? ''
    const withProps = Object.keys(parentViews).filter((viewName) => parentViews[viewName].props)

    if (withProps.length === 1 && withProps[0] === DEFAULT_VIEW_NAME) {
      return {
        name,
        get props() {
          return getParentProps(parentMatch.id, DEFAULT_VIEW_NAME, route, prefetch, pending)
        },
      }
    }

    if (withProps.length > 0) {
      return {
        name,
        props: new Proxy({}, {
          get(target, propName) {
            // a name with no getter can never be stored, so waiting on it would never settle
            if (typeof propName !== 'string' || !withProps.includes(propName)) {
              return Reflect.get(target, propName)
            }

            return getParentProps(parentMatch.id, propName, route, prefetch, pending)
          },
        }),
      }
    }

    return {
      name,
      props: undefined,
    }
  }

  /**
   * Reads a parent view's props, checking the batch being prefetched before the store, and waiting for the
   * parent's own lifecycle to compute them when neither has them yet.
   */
  function getParentProps(id: string, name: string, route: ResolvedRoute, prefetch: boolean = false, pending?: Record<string, StoredProps>): Promise<unknown> {
    const props = readParentProps(id, name, route, prefetch, pending)

    // reading without awaiting must not surface as an unhandled rejection
    props.catch(() => {})

    return props
  }

  function readParentProps(id: string, name: string, route: ResolvedRoute, prefetch: boolean, pending?: Record<string, StoredProps>): Promise<unknown> {
    const key = getPropKey(id, name, route)
    const batched = pending?.[key]

    if (batched !== undefined) {
      return toParentProps(batched)
    }

    const stored = store.get(key)

    if (stored !== undefined) {
      return toParentProps(stored)
    }

    if (prefetch) {
      warnWaitingForParentProps(name, route)
    }

    return toParentProps(waitForProps(key))
  }

  /**
   * Resolves once the given props are stored, and rejects if navigation discards the waiter first, so a
   * getter awaiting them resumes either way.
   */
  function waitForProps(key: string): Promise<PropsResult> {
    return new Promise((resolve, reject) => {
      const stops = waiters.get(key) ?? new Set<Waiter>()

      waiters.set(key, stops)

      waiterScope.run(() => {
        const waiter: Waiter = {
          stop: watch(() => store.get(key), (result) => {
            if (result === undefined) {
              return
            }

            discardWaiter(key, waiter)
            resolve(result)
          }),
          abandon: () => reject(new ParentPropsAbandonedError()),
        }

        stops.add(waiter)
      })
    })
  }

  function discardWaiter(key: string, waiter: Waiter): void {
    waiter.stop()

    const stops = waiters.get(key)

    stops?.delete(waiter)

    if (stops?.size === 0) {
      waiters.delete(key)
    }
  }

  function discardUnusedWaiters(keysToKeep: string[]): void {
    for (const [key, stops] of waiters) {
      if (keysToKeep.includes(key)) {
        continue
      }

      stops.forEach((waiter) => {
        waiter.stop()
        waiter.abandon()
      })

      waiters.delete(key)
    }
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

  /**
   * Always a promise, since the props may not have been computed yet. Rethrows a failed getter's error.
   */
  async function toParentProps(result: MaybePromise<PropsResult>): Promise<unknown> {
    const resolved = await result

    if (resolved.kind === 'error') {
      throw resolved.error
    }

    return resolved.value
  }

  function getPropKey(id: string, name: string, route: ResolvedRoute): string {
    return [id, name, route.id, JSON.stringify(route.params)].join('-')
  }

  function getComponentProps(id: string, views: RouteViews, depth: number): ComponentProps[] {
    return Object.entries(views).map(([name, view]) => ({ id, name, depth, props: view.props as PropsGetter | undefined }))
  }

  function clearUnusedStoreEntries(keysToKeep: string[]): void {
    for (const key of store.keys()) {
      if (keysToKeep.includes(key)) {
        continue
      }

      store.delete(key)
    }

    discardUnusedWaiters(keysToKeep)
  }

  return {
    getPrefetchProps,
    setPrefetchProps,
    getProps,
    setProps,
    setVueApp,
  }
}
