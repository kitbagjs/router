import { markRaw } from 'vue'
import { createRouteId } from '@/services/createRouteId'
import { CreateRouteOptions, PropsGetter, CreateRouteProps, ToRoute, combineRoutes, isWithParent, RouterViewPropsGetter } from '@/types/createRouteOptions'
import { toName } from '@/types/name'
import { Route } from '@/types/route'
import { checkDuplicateParams } from '@/utilities/checkDuplicateParams'
import { toWithParams, withParams } from '@/services/withParams'
import { createRouteHooks } from '@/services/createRouteHooks'
import { createUrl } from '@/services/createUrl'
import { InternalRouteHooks } from '@/types/hooks'
import { ExtractRouteContext } from '@/types/routeContext'
import { RouteRedirects } from '@/types/redirects'
import { createRouteRedirects } from './createRouteRedirects'

type CreateRouteWithProps<
  TOptions extends CreateRouteOptions,
  TProps extends CreateRouteProps<TOptions>
> = CreateRouteProps<TOptions> extends RouterViewPropsGetter<TOptions>
  ? [ props?: RouterViewPropsGetter<TOptions> ]
  : CreateRouteProps<TOptions> extends PropsGetter<TOptions>
    ? Partial<ReturnType<CreateRouteProps<TOptions>>> extends ReturnType<CreateRouteProps<TOptions>>
      ? [ props?: TProps ]
      : [ props: TProps ]
    : Partial<CreateRouteProps<TOptions>> extends CreateRouteProps<TOptions>
      ? [ props?: TProps ]
      : [ props: TProps ]

export function createRoute<
  const TOptions extends CreateRouteOptions,
  const TProps extends CreateRouteProps<TOptions>
>(options: TOptions, ...args: CreateRouteWithProps<TOptions, TProps>): ToRoute<TOptions, TProps>
  & InternalRouteHooks<ToRoute<TOptions>, ExtractRouteContext<TOptions>>
  & RouteRedirects<ToRoute<TOptions>>

export function createRoute(options: CreateRouteOptions, props?: CreateRouteProps): Route {
  const id = createRouteId()
  const name = toName(options.name)
  const path = toWithParams(options.path)
  const query = toWithParams(options.query)
  const hash = toWithParams(options.hash)
  const meta = options.meta ?? {}
  const state = options.state ?? {}
  const context = options.context ?? []
  const { store, ...hooks } = createRouteHooks()
  const rawRoute = markRaw({ id, meta, state, ...options, props })

  const redirects = createRouteRedirects({
    getRoute: () => route,
  })

  const url = createUrl({
    host: withParams(),
    path,
    query,
    hash,
  })

  const route = {
    id,
    matched: rawRoute,
    matches: [rawRoute],
    hooks: [store],
    name,
    meta,
    state,
    context,
    depth: 1,
    prefetch: options.prefetch,
    ...redirects,
    ...url,
    ...hooks,
  } satisfies Route & InternalRouteHooks & RouteRedirects

  const merged = isWithParent(options) ? combineRoutes(options.parent, route) : route

  checkDuplicateParams(merged.path.schema.params, merged.query.schema.params, merged.hash.schema.params)

  return merged
}
