import { RouterPushOptions } from '@/types/routerPush'
import { IsEmptyObject, OnlyRequiredProperties } from '@/types/utilities'
import { RouterReplaceOptions } from '@/types/routerReplace'
import { hasProperty, isRecord } from '@/utilities/guards'

export type RouteMethod<
  TParams extends Record<string, unknown> = Record<string, unknown>
> = IsEmptyObject<TParams> extends true
  ? () => RouteMethodResponse<TParams>
  : IsEmptyObject<OnlyRequiredProperties<TParams>> extends true
    ? (params?: TParams, options?: RouterPushOptions) => RouteMethodResponse<TParams>
    : (params: TParams, options?: RouterPushOptions) => RouteMethodResponse<TParams>

export type RouteMethodImplementation = (params?: Record<string, unknown>, options?: RouterPushOptions) => RouteMethodResponseImplementation

export type RouteMethodOptions<
  TParams extends Record<string, unknown>
> = {
  params?: Partial<TParams>,
}

export type RouteMethodPush<
  TParams extends Record<string, unknown> = Record<string, unknown>
> = (options?: RouteMethodOptions<TParams> & RouterPushOptions) => Promise<void>

export type RouteMethodReplace<
  TParams extends Record<string, unknown> = Record<string, unknown>
> = (options?: RouteMethodOptions<TParams> & RouterReplaceOptions) => Promise<void>

export type RouteMethodResponse<
  TParams extends Record<string, unknown> = Record<string, unknown>
> = {
  url: string,
  push: RouteMethodPush<TParams>,
  replace: RouteMethodReplace<TParams>,
}

export type RouteMethodResponseImplementation = {
  url: string,
  push: (options?: { params?: Record<string, unknown> } & RouterPushOptions) => Promise<void>,
  replace: (options?: { params?: Record<string, unknown> } & RouterReplaceOptions) => Promise<void>,
}

export function isRouteMethodResponse(value: unknown): value is RouteMethodResponse {
  return isRecord(value)
      && hasProperty(value, 'url', String)
      && hasProperty(value, 'push', Function)
      && hasProperty(value, 'replace', Function)
}
