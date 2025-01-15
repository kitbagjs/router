import { markRaw } from 'vue'
import { createRouteId } from '@/services/createRouteId'
import { host } from '@/services/host'
import { CreateRouteOptions, PropsGetter, CreateRouteProps, ToRoute, combineRoutes, isWithParent, isWithState } from '@/types/createRouteOptions'
import { toHash } from '@/types/hash'
import { toName } from '@/types/name'
import { toPath } from '@/types/path'
import { toQuery } from '@/types/query'
import { Route } from '@/types/route'
import { checkDuplicateParams } from '@/utilities/checkDuplicateKeys'

type CreateRouteWithProps<
  TOptions extends CreateRouteOptions,
  TProps extends CreateRouteProps<TOptions> | undefined
> = CreateRouteProps<TOptions> extends PropsGetter<TOptions>
  ? Partial<ReturnType<CreateRouteProps<TOptions>>> extends ReturnType<CreateRouteProps<TOptions>>
    ? [ props?: TProps ]
    : [ props: TProps ]
  : Partial<CreateRouteProps<TOptions>> extends CreateRouteProps<TOptions>
    ? [ props?: TProps ]
    : [ props: TProps ]

export function createRoute<
  const TOptions extends CreateRouteOptions,
  const TProps extends CreateRouteProps<TOptions>
>(options: TOptions, ...args: CreateRouteWithProps<TOptions, TProps>): ToRoute<TOptions, CreateRouteProps<TOptions> extends TProps ? undefined : TProps>

export function createRoute(options: CreateRouteOptions, props?: CreateRouteProps): Route {
  const id = createRouteId()
  const name = toName(options.name)
  const path = toPath(options.path)
  const query = toQuery(options.query)
  const hash = toHash(options.hash)
  const meta = options.meta ?? {}
  const state = isWithState(options) ? options.state : {}
  const rawRoute = markRaw({ id, meta: {}, state: {}, ...options, props })

  const route = {
    id,
    matched: rawRoute,
    matches: [rawRoute],
    name,
    path,
    query,
    hash,
    meta,
    state,
    depth: 1,
    host: host('', {}),
    prefetch: options.prefetch,
  } satisfies Route

  const merged = isWithParent(options) ? combineRoutes(options.parent, route) : route

  checkDuplicateParams(merged.path.params, merged.query.params)

  return merged
}
