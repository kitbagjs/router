import { InjectionKey, reactive } from 'vue'
import { isWithComponent, isWithComponents } from '@/types/createRouteOptions'
import { getPrefetchOption, PrefetchConfigs } from '@/types/prefetch'
import { ResolvedRoute } from '@/types/resolved'  
import { Route } from '@/types/route'
import { getResponseAndError } from '@/utilities/errors'
import { CallbackContext, CallbackPushResponse, CallbackRejectResponse, CallbackSuccessResponse, createCallbackContext } from './createCallbackContext'
import { RouterPushError } from '@/errors/routerPushError'
import { RegisteredRouterPush } from '@/types/register'
import { RouterRejectionError } from '@/errors/routerRejectionError'

export const propStoreKey: InjectionKey<PropStore> = Symbol()

type ComponentProps = { id: string, name: string, props?: (params: Record<string, unknown>, context: CallbackContext) => unknown }

type SetPropsResponse = CallbackSuccessResponse | CallbackPushResponse | CallbackRejectResponse

export type PropStore = {
  getPrefetchProps: (route: ResolvedRoute, prefetch: PrefetchConfigs) => Record<string, unknown>,
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
        const key = getPropKey(id, name, route)
        
        const [value, error] = getResponseAndError(() => props?.(route.params, context))

        response[key] = value ?? error

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

      promises.push((async () => {
        const value = store.get(key) ?? props(route.params, context)

        if (value instanceof Error) {
          throw value
        }

        await value

        store.set(key, value)
      })())
    }

    clearUnusedStoreEntries(keys)

    try {
      await Promise.all(promises)

      return { status: 'SUCCESS' }
    } catch (error) {
      if (error instanceof RouterPushError) {
        return {
          status: 'PUSH',
          to: error.to as Parameters<RegisteredRouterPush>,
        }
      }

      if (error instanceof RouterRejectionError) {
        return { status: 'REJECT', type: error.type }
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
