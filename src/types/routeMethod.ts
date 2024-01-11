import { IsEmptyObject } from '@/types/utilities'

export type RouteMethod<
  TParams extends Record<string, unknown> = any
> = IsEmptyObject<TParams> extends false
  ? (params: TParams, options?: RouteMethodOptions) => RouteMethodResponse
  : (options?: RouteMethodOptions) => RouteMethodResponse

export type RouteMethodOptions = {
  replace: boolean,
  skipRouting: boolean,
}

export type RouteMethodResponse = {
  url: string,
  // push: RouteMethodPush,
  // replace: RouteMethodReplace,
}
