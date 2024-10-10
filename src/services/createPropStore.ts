import { InjectionKey, reactive } from 'vue'
import { isWithComponent, isWithComponents } from '@/types/createRouteOptions'
import { ResolvedRoute } from '@/types/resolved'
import { Route } from '@/types/route'

export const propStoreKey: InjectionKey<PropStore> = Symbol()

type ComponentProps = { id: string, name: string, props?: (params: Record<string, unknown>) => unknown }

export type PropStore = {
  setProps: (route: ResolvedRoute, options: { prefetch: boolean }) => void,
  getProps: (id: string, name: string, params: Record<string, unknown>) => unknown,
}

export function createPropStore(): PropStore {
  const store: Map<string, unknown> = reactive(new Map())

  const setProps: PropStore['setProps'] = (route, { prefetch }) => {
    const routeKeys: string[] = []
    const componentProps = route.matches.flatMap(match => getComponentProps(match))

    for (const { id, name, props } of componentProps) {
      if (!props) {
        continue
      }

      const key = getPropKey(id, name, route.params)

      if (store.has(key)) {
        continue
      }

      const value = props(route.params)

      store.set(key, value)

      routeKeys.push(key)
    }

    // if props are being prefetched then we return early and don't clear out any other props
    if (prefetch) {
      return
    }

    // clear out any props that don't match the route passed in
    for (const key in store.keys()) {
      if (routeKeys.includes(key)) {
        continue
      }

      store.delete(key)
    }
  }

  const getProps: PropStore['getProps'] = (id, name, params) => {
    const key = getPropKey(id, name, params)

    return store.get(key)
  }

  function getPropKey(id: string, name: string, params: unknown): string {
    return `${id}-${name}-${JSON.stringify(params)}`
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

  return { setProps, getProps }
}