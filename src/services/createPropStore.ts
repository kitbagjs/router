import { InjectionKey, reactive } from 'vue'
import { isWithComponent, isWithComponents } from '@/types/createRouteOptions'
import { getPrefetchOption, PrefetchConfigs } from '@/types/prefetch'
import { ResolvedRoute } from '@/types/resolved'
import { Route } from '@/types/route'

export const propStoreKey: InjectionKey<PropStore> = Symbol()

type ComponentProps = { id: string, name: string, props?: (params: Record<string, unknown>) => unknown }

export type PropStore = {
  prefetchProps: (route: ResolvedRoute, prefetch: PrefetchConfigs) => void,
  setProps: (route: ResolvedRoute) => void,
  getProps: (id: string, name: string, route: ResolvedRoute) => unknown,
}

export function createPropStore(): PropStore {
  const store: Map<string, unknown> = reactive(new Map())

  const prefetchProps: PropStore['prefetchProps'] = (route, prefetch) => {
    route.matches
      .filter(match => getPrefetchOption({ ...prefetch, routePrefetch: match.prefetch }, 'props'))
      .flatMap(getComponentProps)
      .forEach(({ id, name, props }) => {
        if (props) {
          const key = getPropKey(id, name, route)
          const value = props(route.params)

          store.set(key, value)
        }
      })
  }

  const setProps: PropStore['setProps'] = (route) => {
    const componentProps = route.matches.flatMap(getComponentProps)
    const routeKeys = componentProps.reduce<string[]>((routeKeys, { id, name, props }) => {
      const key = getPropKey(id, name, route)

      if (!props || store.has(key)) {
        return routeKeys
      }

      const value = props(route.params)

      store.set(key, value)

      return [...routeKeys, key]
    }, [])

    clearUnusedStoreEntries(routeKeys)
  }

  const getProps: PropStore['getProps'] = (id, name, route) => {
    const key = getPropKey(id, name, route)

    return store.get(key)
  }

  function getPropKey(id: string, name: string, route: ResolvedRoute): string {
    return [id, name, route.id, JSON.stringify(route.params)].join('-')
  }

  function getComponentProps(options: Route['matched']): ComponentProps[] {
    if (isWithComponents(options)) {
      return Object.entries(options.props ?? {}).map(([name, props]) => ({ id: options.id, name, props }))
    }

    if (isWithComponent(options)) {
      return [
        {
          id: options.id,
          name: 'default',
          props: options.props,
        },
      ]
    }

    return []
  }

  function clearUnusedStoreEntries(keysToKeep: string[]): void {
    for (const key in store.keys()) {
      if (keysToKeep.includes(key)) {
        continue
      }

      store.delete(key)
    }
  }

  return { prefetchProps, setProps, getProps }
}