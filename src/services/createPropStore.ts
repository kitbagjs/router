import { InjectionKey, reactive } from 'vue'
import { CallbackContext, CallbackContextPushResponse, CallbackContextRejectResponse, CallbackContextSuccessResponse, createCallbackContext } from '@/services/createCallbackContext'
import { isWithComponent, isWithComponents } from '@/types/createRouteOptions'
import { ResolvedRoute } from '@/types/resolved'
import { Route} from '@/types/route'
import { MaybePromise } from '@/types/utilities'
import { RegisteredRouterPush } from '@/types/register'
import { RouterPushError } from '@/errors/routerPushError'
import { RouterRejectionError } from '@/errors/routerRejectionError'

export const propStoreKey: InjectionKey<PropStore> = Symbol()

type ComponentProps = { id: string, name: string, props?: (params: Record<string, unknown>, context: CallbackContext) => unknown }

type RoutePropsResponse = CallbackContextSuccessResponse | CallbackContextPushResponse | CallbackContextRejectResponse

export type PropStore = {
  setProps: (route: ResolvedRoute) => Promise<RoutePropsResponse>,
  getProps: (id: string, name: string, params: unknown) => MaybePromise<unknown> | undefined,
}

export function createPropStore(): PropStore {
  const context = createCallbackContext()
  const store = reactive(new Map<string, unknown>())

  const setProps: PropStore['setProps'] = async (route) => {
    store.clear()

    const promises = route.matches
      .flatMap(match => getComponentProps(match))
      .map(async({ id, name, props }) => {
        if (props) {
          const key = getPropKey(id, name, route.params)
          const value = props(route.params, context)

          store.set(key, value)

          return await value
        }
      })

    try {
      await Promise.all(promises)

      return { status: 'SUCCESS' }
    } catch (error) {
      // should we have a RegisteredRouterPushError?
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