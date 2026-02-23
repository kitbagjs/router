import { markRaw } from 'vue'
import { createRouteId } from '@/services/createRouteId'
import { CreateRouteOptions, PropsGetter, CreateRouteProps, ToRoute, combineRoutes, isWithParent, RouterViewPropsGetter } from '@/types/createRouteOptions'
import { toName } from '@/types/name'
import { Route } from '@/types/route'
import { createRouteHooks } from '@/services/createRouteHooks'
import { toUrlPart, toUrlQueryPart } from '@/services/withParams'
import { createUrl } from '@/services/createUrl'
import { createRouteRedirects } from '@/services/createRouteRedirects'
import { combineUrl } from '@/services/combineUrl'
import { InternalRouteHooks } from '@/types/hooks'
import { ExtractRouteContext } from '@/types/routeContext'
import { RouteRedirects } from '@/types/redirects'
import { createRouteTitle, RouteTitle } from '@/types/titles'

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
  & RouteTitle<ToRoute<TOptions>>

export function createRoute(options: CreateRouteOptions, props?: CreateRouteProps): Route {
  const id = createRouteId()
  const name = toName(options.name)
  const path = toUrlPart(options.path)
  const query = toUrlQueryPart(options.query)
  const hash = toUrlPart(options.hash)
  const meta = options.meta ?? {}
  const state = options.state ?? {}
  const context = options.context ?? []
  const { store, ...hooks } = createRouteHooks()
  const title = createRouteTitle(options.parent)
  const rawRoute = markRaw({ ...options, id, meta, state, props, name })

  const redirects = createRouteRedirects({
    getRoute: () => route,
  })

  const url = createUrl({
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
    ...title,
  } satisfies Route & InternalRouteHooks & RouteRedirects & RouteTitle

  if (isWithParent(options)) {
    const merged = combineRoutes(options.parent, route)
    const url = combineUrl(options.parent, {
      path,
      query,
      hash,
    })

    return {
      ...merged,
      ...url,
    }
  }

  return route
}
