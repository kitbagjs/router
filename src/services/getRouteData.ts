import { NavigationData } from '@/services/createRouterNavigation'
import { getComputations, isKind } from '@/services/getComputations'
import { NavigationAbandonedError } from '@/errors/navigationAbandonedError'
import { isPromise } from '@/utilities/promises'
import { DataRecord } from '@/types/data'
import { ResolvedRoute } from '@/types/resolved'

export function getRouteData(navigation: Pick<NavigationData, 'getValues'>, route: ResolvedRoute): DataRecord {
  const loaders = getComputations(route).filter(isKind('loader'))
  const values = navigation.getValues(loaders, route)
  const data = new Proxy(values, {
    get(target, property, receiver) {
      const value = Reflect.get(target, property, receiver)

      if (isPromise(value)) {
        return toComponentValue(value)
      }

      return value
    },
    getOwnPropertyDescriptor(target, property) {
      const descriptor = Reflect.getOwnPropertyDescriptor(target, property)

      if (descriptor && isPromise(descriptor.value)) {
        descriptor.value = toComponentValue(descriptor.value)
      }

      return descriptor
    },
  })

  return data
}

function toComponentValue(promise: Promise<unknown>): Promise<unknown> {
  const value = promise.catch((error: unknown) => {
    if (error instanceof NavigationAbandonedError) {
      return new Promise<never>(() => {})
    }

    throw error
  })

  value.catch(() => {})

  return value
}
