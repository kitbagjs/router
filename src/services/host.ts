import { getParamsForString } from '@/services/getParamsForString'
import { Host, HostParamsWithParamNameExtracted } from '@/types/host'
import { Param } from '@/types/paramTypes'
import { Identity } from '@/types/utilities'

/**
 * Constructs a Host object, which enables assigning types for params. Note, the host should not include protocol.
 *
 * @template THost - The string literal type that represents the host.
 * @template TParams - The type of the host parameters associated with the host.
 * @param host - The host string.
 * @param params - The parameters associated with the host, typically as key-value pairs.
 * @returns An object representing the host which includes the host string, its parameters,
 *          and a toString method for getting the host as a string.
 *
 * @example
 * ```ts
 * import { createRoutes, host } from '@kitbag/router'
 *
 * export const routes = createRoutes([
 *   {
 *     name: 'docs',
 *     host: host('[subdomain]', { foo: String }),
 *     component: Docs
 *   },
 * ])
 * ```
 */
export function host<THost extends string, TParams extends HostParamsWithParamNameExtracted<THost>>(host: THost, params: Identity<TParams>): Host<THost, TParams>
export function host(host: string, params: Record<string, Param | undefined>): Host {
  return {
    host,
    params: getParamsForString(host, params),
    toString: () => host,
  }
}
