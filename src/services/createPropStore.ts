import { effectScope, reactive, watch, WatchHandle } from 'vue'
import { isWithComponentProps, isWithComponentPropsRecord, PropsGetter } from '@/types/createRouteOptions'
import type { PrefetchConfigs, PrefetchStrategy } from '@/types/prefetch'
import { getPrefetchOption } from '@/utilities/prefetch'
import { ResolvedRoute } from '@/types/resolved'
import { RouteViews } from '@/types/routeViews'
import { ContextPushError } from '@/errors/contextPushError'
import { ContextRejectionError } from '@/errors/contextRejectionError'
import { ParentPropsAbandonedError } from '@/errors/parentPropsAbandonedError'
import { getPropsValue } from '@/utilities/props'
import { PropsCallbackParent } from '@/types/props'
import { createVueAppStore, HasVueAppStore } from './createVueAppStore'
import { CallbackContextPush, CallbackContextReject, CallbackContextSuccess } from '@/types/callbackContext'
import { createRouterCallbackContext } from './createRouterCallbackContext'

type ComponentProps = { id: string, name: string, depth: number, props?: PropsGetter }

type Waiter = { stop: WatchHandle, abandon: () => void }

type SetPropsResponse = CallbackContextSuccess | CallbackContextPush | CallbackContextReject

export type PropStore = HasVueAppStore & {
  getPrefetchProps: (strategy: PrefetchStrategy, route: ResolvedRoute, configs: PrefetchConfigs, prefetched?: Record<string, unknown>) => Record<string, unknown>,
  setPrefetchProps: (props: Record<string, unknown>) => void,
  setProps: (route: ResolvedRoute) => Promise<SetPropsResponse>,
  getProps: (id: string, name: string, route: ResolvedRoute) => unknown,
}

export function createPropStore(): PropStore {
  const { setVueApp, runWithContext } = createVueAppStore()
  const store: Map<string, unknown> = reactive(new Map())
  const waiters = new Map<string, Set<Waiter>>()

  /**
   * Waiters are created while a props getter runs, which can be inside the effect scope of whichever
   * component triggered a prefetch. That component often unmounts as part of the navigation the waiter is
   * waiting for, so they are owned by a detached scope instead of being disposed along with it.
   */
  const waiterScope = effectScope(true)

  /**
   * The response is seeded with props already prefetched at earlier strategies so that a child
   * prefetching later than its parent resolves the parent's pending props instead of waiting for
   * navigation to commit them to the store.
   */
  const getPrefetchProps: PropStore['getPrefetchProps'] = (strategy, route, prefetch, prefetched = {}) => {
    const { push, replace, reject, update } = createRouterCallbackContext({ to: route })

    return route.matches
      .map((match, index) => ({ match, views: route.views[index], depth: index }))
      .filter(({ match }) => getPrefetchOption({ ...prefetch, routePrefetch: match.prefetch }, 'props') === strategy)
      .flatMap(({ views, depth }) => getComponentProps(views, depth))
      .reduce<Record<string, unknown>>((response, { id, name, depth, props }) => {
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
    const componentProps = route.views.flatMap((views, depth) => getComponentProps(views, depth))
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
        const value = await store.get(key)

        if (value instanceof Error) {
          throw value
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

    return store.get(key)
  }

  /**
   * The parent context for the view at the given depth. Must be resolved per depth rather than from the
   * end of the tuples: every view in a nested route gets its own parent, not the resolved route's parent.
   */
  function getParentContext(route: ResolvedRoute, depth: number, prefetch: boolean = false, pending?: Record<string, unknown>): PropsCallbackParent {
    if (depth === 0) {
      return
    }

    const parentMatch = route.matches[depth - 1]
    const parentViews = route.views[depth - 1]

    const name = parentMatch.name ?? ''

    if (isWithComponentProps(parentViews)) {
      return {
        name,
        get props() {
          return getParentProps(parentViews.id, 'default', route, prefetch, pending)
        },
      }
    }

    if (isWithComponentPropsRecord(parentViews)) {
      return {
        name,
        props: new Proxy({}, {
          get(target, propName) {
            // names without a getter in the parent's props record can never be stored, so waiting on
            // them would never settle — they fall through to the target's own (undefined) properties
            if (typeof propName !== 'string' || !Object.prototype.hasOwnProperty.call(parentViews.props, propName)) {
              return Reflect.get(target, propName)
            }

            return getParentProps(parentViews.id, propName, route, prefetch, pending)
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
   * Reads a parent view's props. While prefetching, values are only written to the store once navigation
   * commits, so the batch being built is checked first — a parent's props are computed earlier in the same
   * batch (matches are walked outermost first) and would otherwise be invisible to its children.
   *
   * When the parent's props have not been computed yet, the parent's own lifecycle is left to compute them
   * and the returned promise resolves once it has, rather than handing back undefined as though the parent
   * had no props.
   */
  function getParentProps(id: string, name: string, route: ResolvedRoute, prefetch: boolean = false, pending?: Record<string, unknown>): Promise<unknown> {
    const key = getPropKey(id, name, route)

    if (pending && key in pending) {
      return toParentProps(pending[key])
    }

    if (store.has(key)) {
      return toParentProps(store.get(key))
    }

    if (prefetch) {
      warnWaitingForParentProps(name, route)
    }

    return toParentProps(waitForProps(key))
  }

  /**
   * Resolves once the given props have been computed and stored. Watches for the key's existence rather
   * than its value so that props which are legitimately `undefined` still resolve. Rejects with
   * ParentPropsAbandonedError if navigation moves somewhere else first, at which point the waiter is
   * discarded along with the props it was waiting for.
   */
  function waitForProps(key: string): Promise<unknown> {
    return new Promise((resolve, reject) => {
      const stops = waiters.get(key) ?? new Set<Waiter>()

      waiters.set(key, stops)

      waiterScope.run(() => {
        const waiter: Waiter = {
          stop: watch(() => store.has(key), (has) => {
            if (!has) {
              return
            }

            discardWaiter(key, waiter)
            resolve(store.get(key))
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
   * A parent's props are always handed to a child as a promise, whether or not they have been computed
   * yet, so that the type does not have to claim a value is already available.
   *
   * A failed props getter is stored as its error rather than thrown, so that navigation can inspect the
   * settled value. Consumers expect the props themselves, so the error is rethrown here rather than being
   * handed back as though it were a valid value.
   */
  async function toParentProps(value: unknown): Promise<unknown> {
    const resolved = await value

    if (resolved instanceof Error) {
      throw resolved
    }

    return resolved
  }

  function getPropKey(id: string, name: string, route: ResolvedRoute): string {
    return [id, name, route.id, JSON.stringify(route.params)].join('-')
  }

  function getComponentProps(views: RouteViews, depth: number): ComponentProps[] {
    if (isWithComponentProps(views)) {
      return [
        {
          id: views.id,
          name: 'default',
          depth,
          props: views.props,
        },
      ]
    }

    if (isWithComponentPropsRecord(views)) {
      return Object.entries(views.props).map(([name, props]) => ({ id: views.id, name, depth, props }))
    }

    return []
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
