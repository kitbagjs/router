import { ExtractRouteMethodParams, RouteMethod } from '@/types/routeMethods'
import { Identity } from '@/types/utilities'

type Route<T> = {
  name: string,
  params: ExtractRouteMethodParams<T>,
  query: unknown,
  hash: string,
}

export function useRoute<T extends RouteMethod<any>>(): Identity<Route<T>> {
  throw 'not implemented'
}