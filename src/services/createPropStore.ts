import { InjectionKey, reactive } from 'vue'
import { isWithComponent, isWithComponents } from '@/types/createRouteOptions'
import { ResolvedRoute } from '@/types/resolved'
import { Route } from '@/types/route'
import { MaybePromise } from '@/types/utilities'

export const propStoreKey: InjectionKey<PropStore> = Symbol()

type ComponentProps = { id: string, name: string, props?: (params: Record<string, unknown>) => unknown }

export type PropStore = {
  setProps: (route: ResolvedRoute) => void,
  getProps: (id: string, name: string, params: unknown) => MaybePromise<unknown> | undefined,
}

export function createPropStore(): PropStore {
  const store = reactive(new Map<string, unknown>())

  function setProps(route: ResolvedRoute): void {
    store.clear()

    route.matches
      .flatMap(match => getComponentProps(match))
      .forEach(({ id, name, props }) => {
        if (props) {
          const key = getPropKey(id, name, route.params)
          const value = props(route.params)

          store.set(key, value)
        }
      })
  }

  function getProps(id: string, name: string, params: unknown): MaybePromise<unknown> | undefined {
    const key = getPropKey(id, name, params)

    return store.get(key)
  }

  function getPropKey(id: string, name: string, params: unknown): string {
    return [id, name, JSON.stringify(params)].join('-')
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