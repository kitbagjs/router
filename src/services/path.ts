import { getParamsForString } from '@/services/getParamsForString'
import { Path, PathParams } from '@/types/path'
import { Identity } from '@/types/utilities'

/**
 * Constructs a Path object, which enables assigning types for params.
 *
 * @template TPath - The string literal type that represents the path.
 * @template TParams - The type of the path parameters associated with the path.
 * @param path - The path string.
 * @param params - The parameters associated with the path, typically as key-value pairs.
 * @returns An object representing the path which includes the path string, its parameters,
 *          and a toString method for getting the path as a string.
 *
 * @example
 * ```ts
 * import { createRoutes, path } from '@kitbag/router'
 *
 * export const routes = createRoutes([
 *   {
 *     name: 'home',
 *     path: path('/:foo', { foo: Number }),
 *     component: Home
 *   },
 * ])
 * ```
 */
export function path<TPath extends string, TParams extends PathParams<TPath>>(path: TPath, params: Identity<TParams>): Path<TPath, TParams> {
  return {
    path,
    params: getParamsForString(path, params) as Path<TPath, TParams>['params'],
    toString: () => path,
  }
}
