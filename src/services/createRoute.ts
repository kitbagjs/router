import { markRaw } from 'vue'
import { createRouteId } from '@/services/createRouteId'
import { CreateRouteOptions, PropsGetter, CreateRouteProps, ToRoute, combineRoutes, isWithParent } from '@/types/createRouteOptions'
import { toName } from '@/types/name'
import { Route } from '@/types/route'
import { checkDuplicateParams } from '@/utilities/checkDuplicateKeys'
import { toWithParams, withParams } from '@/services/withParams'
import { createRouteHooks } from '@/services/createRouteHooks'
import { InternalRouteHooks } from '@/types/hooks'

type CreateRouteWithProps<
  TOptions extends CreateRouteOptions,
  TProps extends CreateRouteProps<TOptions>
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
  & InternalRouteHooks<TOptions['context']>

export function createRoute(options: CreateRouteOptions, props?: CreateRouteProps): Route {
  const id = createRouteId()
  const name = toName(options.name)
  const path = toWithParams(options.path)
  const query = toWithParams(options.query)
  const hash = toWithParams(options.hash)
  const meta = options.meta ?? {}
  const state = options.state ?? {}
  const context = options.context ?? []
  const hooks = createRouteHooks(context)
  const rawRoute = markRaw({ id, meta, state, ...options, props })

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
    context,
    depth: 1,
    host: withParams(),
    prefetch: options.prefetch,
    ...hooks,
  } satisfies Route

  const merged = isWithParent(options) ? combineRoutes(options.parent, route) : route

  checkDuplicateParams(merged.path.params, merged.query.params, merged.hash.params)

  return merged
}
