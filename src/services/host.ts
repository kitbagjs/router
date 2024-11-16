import { getParamsForString } from '@/services/getParamsForString'
import { Host, HostParamsWithParamNameExtracted } from '@/types/host'
import { Param } from '@/types/paramTypes'
import { Identity } from '@/types/utilities'

/**
 * Constructs a Host object, which enables assigning types for params. Note, the host should not include protocol.
 *
 * @template THost - The string literal type that represents the host.
 * @template TParams - The type of the host parameters associated with the host.
 * @param value - The host string.
 * @param params - The parameters associated with the host, typically as key-value pairs.
 * @returns An object representing the host which includes the host string, its parameters,
 *          and a toString method for getting the host as a string.
 *
 * @example
 * ```ts
 * import { createExternalRoute, host } from '@kitbag/router'
 *
 * export const routes = createExternalRoute({
 *   name: 'docs',
 *   host: host('[subdomain].example.com', { foo: String }),
 *   component: Docs
 * })
 * ```
 */
export function host<THost extends string, TParams extends HostParamsWithParamNameExtracted<THost>>(value: THost, params: Identity<TParams>): Host<THost, TParams>
export function host(value: string, params: Record<string, Param | undefined>): Host {
  return {
    value,
    params: getParamsForString(value, params),
  }
}
