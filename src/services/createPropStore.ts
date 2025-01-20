import { InjectionKey, reactive } from 'vue'
import { isWithComponentProps, isWithComponentPropsRecord, PropsGetter } from '@/types/createRouteOptions'
import { getPrefetchOption, PrefetchConfigs, PrefetchStrategy } from '@/types/prefetch'
import { ResolvedRoute } from '@/types/resolved'
import { Route } from '@/types/route'
import { CallbackPushResponse, CallbackRejectResponse, CallbackSuccessResponse, createCallbackContext } from './createCallbackContext'
import { CallbackContextPushError } from '@/errors/callbackContextPushError'
import { CallbackContextRejectionError } from '@/errors/callbackContextRejectionError'
import { getPropsValue } from '@/utilities/props'
import { PropsCallbackParent } from '@/types/props'

export const propStoreKey: InjectionKey<PropStore> = Symbol()

type ComponentProps = { id: string, name: string, props?: PropsGetter }

type SetPropsResponse = CallbackSuccessResponse | CallbackPushResponse | CallbackRejectResponse

export type PropStore = {
  getPrefetchProps: (strategy: PrefetchStrategy, route: ResolvedRoute, configs: PrefetchConfigs) => Record<string, unknown>,
  setPrefetchProps: (props: Record<string, unknown>) => void,
  setProps: (route: ResolvedRoute) => Promise<SetPropsResponse>,
  getProps: (id: string, name: string, route: ResolvedRoute) => unknown,
}

export function createPropStore(): PropStore {
  const store: Map<string, unknown> = reactive(new Map())
  const { push, replace, reject } = createCallbackContext()

  const getPrefetchProps: PropStore['getPrefetchProps'] = (strategy, route, prefetch) => {
    return route.matches
      .filter((match) => getPrefetchOption({ ...prefetch, routePrefetch: match.prefetch }, 'props') === strategy)
      .flatMap((match) => getComponentProps(match))
      .reduce<Record<string, unknown>>((response, { id, name, props }) => {
        if (!props) {
          return response
        }

        const key = getPropKey(id, name, route)
        const value = getPropsValue(() => props(route, {
          push,
          replace,
          reject,
          parent: getParentContext(route, true),
        }))

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
    const componentProps = route.matches.flatMap(getComponentProps)
    const keys: string[] = []
    const promises: Promise<unknown>[] = []

    for (const { id, name, props } of componentProps) {
      if (!props) {
        continue
      }

      const key = getPropKey(id, name, route)

      keys.push(key)

      if (!store.has(key)) {
        const value = getPropsValue(() => props(route, {
          push,
          replace,
          reject,
          parent: getParentContext(route),
        }))

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
      if (error instanceof CallbackContextPushError) {
        return error.response
      }

      if (error instanceof CallbackContextRejectionError) {
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
    const parent = route.matches.at(-2)

    if (!parent) {
      return
    }

    if (isWithComponentProps(parent)) {
      return {
        name: parent.name ?? '',
        get props() {
          return getParentProps(parent, 'default', route, prefetch)
        },
      } as PropsCallbackParent
    }

    if (isWithComponentPropsRecord(parent)) {
      return {
        name: parent.name ?? '',
        props: new Proxy({} as any, {
          get(target, name) {
            if (typeof name !== 'string') {
              return Reflect.get(target, name)
            }

            return getParentProps(parent, name, route, prefetch)
          },
        }),
      }
    }

    return {
      name: parent.name ?? '',
      props: undefined,
    }
  }

  function getParentProps(parent: Route['matched'], name: string, route: ResolvedRoute, prefetch: boolean = false): unknown {
    const value = getProps(parent.id, name, route)

    if (prefetch && !value) {
      const parentName = parent.name ?? 'unknown'
      const routeName = route.name || 'unknown'

      console.warn(`
        Unable to access parent props "${name}" from route "${parentName}" while prefetching props for route "${routeName}".
        This may occur if the parent route's props were not also prefetched.
      `)
    }

    return value
  }

  function getPropKey(id: string, name: string, route: ResolvedRoute): string {
    return [id, name, route.id, JSON.stringify(route.params)].join('-')
  }

  function getComponentProps(options: Route['matched']): ComponentProps[] {
    if (isWithComponentProps(options)) {
      return [
        {
          id: options.id,
          name: 'default',
          props: options.props,
        },
      ]
    }

    if (isWithComponentPropsRecord(options)) {
      return Object.entries(options.props).map(([name, props]) => ({ id: options.id, name, props }))
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
  }
}
