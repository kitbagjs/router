import { InjectionKey, reactive } from 'vue'
import { isWithComponent, isWithComponents } from '@/types/createRouteOptions'
import { getPrefetchOption, PrefetchConfigs } from '@/types/prefetch'
import { ResolvedRoute } from '@/types/resolved'  
import { Route } from '@/types/route'
import { CallbackContext, CallbackPushResponse, CallbackRejectResponse, CallbackSuccessResponse, createCallbackContext } from './createCallbackContext'
import { CallbackContextPushError } from '@/errors/callbackContextPushError'
import { CallbackContextRejectionError } from '@/errors/callbackContextRejectionError'
import { getPropsValue } from '@/utilities/props'

export const propStoreKey: InjectionKey<PropStore> = Symbol()

type ComponentProps = { id: string, name: string, props?: (params: Record<string, unknown>, context: CallbackContext) => unknown }

type SetPropsResponse = CallbackSuccessResponse | CallbackPushResponse | CallbackRejectResponse

export type PropStore = {
  getPrefetchProps: (strategy: PrefetchStrategy, route: ResolvedRoute, configs: PrefetchConfigs) => null | Record<string, unknown>,
  setPrefetchProps: (props: Record<string, unknown>) => void,
  setProps: (route: ResolvedRoute) => Promise<SetPropsResponse>,
  getProps: (id: string, name: string, route: ResolvedRoute) => unknown,
}

export function createPropStore(): PropStore {
  const store: Map<string, unknown> = reactive(new Map())
  const context = createCallbackContext()

  const getPrefetchProps: PropStore['getPrefetchProps'] = (route, prefetch) => {
    return route.matches
      .filter((match) => getPrefetchOption({ ...prefetch, routePrefetch: match.prefetch }, 'props'))
      .flatMap((match) => getComponentProps(match))
      .reduce<Record<string, unknown>>((response, { id, name, props }) => {
        if (!props) {
          return response
        }

        const key = getPropKey(id, name, route)
        const value = getPropsValue(() => props(route.params, context))

        response[key] = value

    if (!callbacks.length) {
      return null
    }

    return callbacks.reduce<Record<string, unknown>>((response, { id, name, props }) => {
      const key = getPropKey(id, name, route)

      response[key] = props?.(route.params)

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
        const value = getPropsValue(() => props(route.params, context))

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

  return {
    getPrefetchProps,
    setPrefetchProps,
    getProps,
    setProps,
  }
}
