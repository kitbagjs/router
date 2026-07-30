import { reactive } from 'vue'
import { PropsGetter } from '@/types/createRouteOptions'
import type { PrefetchConfigs, PrefetchStrategy } from '@/types/prefetch'
import { getPrefetchOption } from '@/utilities/prefetch'
import { ResolvedRoute } from '@/types/resolved'
import { RouteViews } from '@/types/routeViews'
import { DEFAULT_VIEW_NAME, isWithBareViewProps, isWithViewProps } from './createRouteViews'
import { ContextPushError } from '@/errors/contextPushError'
import { ContextRejectionError } from '@/errors/contextRejectionError'
import { getPropsValue } from '@/utilities/props'
import { PropsCallbackParent } from '@/types/props'
import { createVueAppStore, HasVueAppStore } from './createVueAppStore'
import { CallbackContextPush, CallbackContextReject, CallbackContextSuccess } from '@/types/callbackContext'
import { createRouterCallbackContext } from './createRouterCallbackContext'

type ComponentProps = { id: string, name: string, props?: PropsGetter }

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
      .map((match) => ({ match, views: match.views }))
      .flatMap(({ match, views }) => getComponentProps(match.id, views).map((componentProps) => ({ match, views, componentProps })))
      .filter(({ match, views, componentProps }) => getPrefetchOption({
        ...prefetch,
        routePrefetch: match.prefetch,
        viewPrefetch: views[componentProps.name].prefetch,
      }, 'props') === strategy)
      .map(({ componentProps }) => componentProps)
      .reduce<Record<string, unknown>>((response, { id, name, props }) => {
        if (!props) {
          return response
        }

        const key = getPropKey(id, name, route)
        const value = runWithContext(() => getPropsValue(() => props(route, {
          push,
          replace,
          reject,
          update,
          parent: getParentContext(route, true),
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
    const componentProps = route.matches.flatMap((match) => getComponentProps(match.id, match.views))
    const keys: string[] = []
    const promises: Promise<unknown>[] = []

    for (const { id, name, props } of componentProps) {
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
          parent: getParentContext(route),
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

  function getParentContext(route: ResolvedRoute, prefetch: boolean = false): PropsCallbackParent {
    const parentMatch = route.matches.at(-2)

    if (!parentMatch) {
      return
    }

    const parentViews = parentMatch.views

    const name = parentMatch.name ?? ''

    if (isWithBareViewProps(parentViews)) {
      return {
        name,
        get props() {
          return getParentProps(parentMatch.id, DEFAULT_VIEW_NAME, route, prefetch)
        },
      }
    }

    if (isWithViewProps(parentViews)) {
      return {
        name,
        props: new Proxy({}, {
          get(target, propName) {
            if (typeof propName !== 'string') {
              return Reflect.get(target, propName)
            }

            return getParentProps(parentMatch.id, propName, route, prefetch)
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

  function getComponentProps(id: string, views: RouteViews): ComponentProps[] {
    return Object.entries(views).map(([name, view]) => ({ id, name, props: view.props as PropsGetter | undefined }))
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
