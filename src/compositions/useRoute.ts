import { ExtractRouterRouteParamTypes, RouterRoute } from '@/types'
import { Identity } from '@/types/utilities'

type Route<T extends RouterRoute> = {
  name: string,
  params: ExtractRouterRouteParamTypes<T>,
  query: unknown,
  hash: string,
}

export function useRoute<T extends RouterRoute>(): Identity<Route<T>> {
  throw 'not implemented'
}