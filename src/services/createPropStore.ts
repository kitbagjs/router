import { reactive } from 'vue'
import { isWithComponentProps, isWithComponentPropsRecord, PropsGetter } from '@/types/createRouteOptions'
import type { PrefetchConfigs, PrefetchStrategy } from '@/types/prefetch'
import { getPrefetchOption } from '@/utilities/prefetch'
import { ResolvedRoute } from '@/types/resolved'
import { RouteViews } from '@/types/routeViews'
import { ContextPushError } from '@/errors/contextPushError'
import { ContextRejectionError } from '@/errors/contextRejectionError'
import { getPropsValue } from '@/utilities/props'
import { PropsCallbackParent } from '@/types/props'
import { createVueAppStore, HasVueAppStore } from './createVueAppStore'
import { CallbackContextPush, CallbackContextReject, CallbackContextSuccess } from '@/types/callbackContext'
import { createRouterCallbackContext } from './createRouterCallbackContext'

type ComponentProps = { id: string, name: string, depth: number, props?: PropsGetter }

type SetPropsResponse = CallbackContextSuccess | CallbackContextPush | CallbackContextReject

export type PropStore = HasVueAppStore & {
  getPrefetchProps: (strategy: PrefetchStrategy, route: ResolvedRoute, configs: PrefetchConfigs) => Record<string, unknown>,
  setPrefetchProps: (props: Record<string, unknown>) => void,
  setProps: (route: ResolvedRoute) => Promise<SetPropsResponse>,
  getProps: (id: string, name: string, route: ResolvedRoute) => unknown,
}

export function createPropStore(): PropStore {
  const { setVueApp, runWithContext } = createVueAppStore()
  const store: Map<string, unknown> = reactive(new Map())

  const getPrefetchProps: PropStore['getPrefetchProps'] = (strategy, route, prefetch) => {
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
          parent: getParentContext(route, depth, true),
        })))

        response[key] = value

        return response
      }, {})
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
  function getParentContext(route: ResolvedRoute, depth: number, prefetch: boolean = false): PropsCallbackParent {
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
          return getParentProps(parentViews.id, 'default', route, prefetch)
        },
      }
    }

    if (isWithComponentPropsRecord(parentViews)) {
      return {
        name,
        props: new Proxy({}, {
          get(target, propName) {
            if (typeof propName !== 'string') {
              return Reflect.get(target, propName)
            }

            return getParentProps(parentViews.id, propName, route, prefetch)
          },
        }),
      }
    }

    return {
      name,
      props: undefined,
    }
  }

  function getParentProps(id: string, name: string, route: ResolvedRoute, prefetch: boolean = false): unknown {
    const value = getProps(id, name, route)

    if (prefetch && !value) {
      const routeName = route.name || 'unknown'

      console.warn(`
        Unable to access parent props "${name}" while prefetching props for route "${routeName}".
        This may occur if the parent route's props were not also prefetched.
      `)
    }

    return value
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
  }

  return {
    getPrefetchProps,
    setPrefetchProps,
    getProps,
    setProps,
    setVueApp,
  }
}
