import { Component, markRaw } from 'vue'
import { CombineHash } from '@/services/combineHash'
import { CombineMeta } from '@/services/combineMeta'
import { CombinePath } from '@/services/combinePath'
import { CombineQuery } from '@/services/combineQuery'
import { CombineState } from '@/services/combineState'
import { createRouteId } from '@/services/createRouteId'
import { host } from '@/services/host'
import { CreateRouteOptions, combineRoutes, isWithParent, isWithState } from '@/types/createRouteOptions'
import { toHash, ToHash } from '@/types/hash'
import { Host } from '@/types/host'
import { toName, ToName } from '@/types/name'
import { ToPath, toPath } from '@/types/path'
import { ToQuery, toQuery } from '@/types/query'
import { Route } from '@/types/route'
import { checkDuplicateParams } from '@/utilities/checkDuplicateKeys'
import { ComponentProps } from './component'
import { ResolvedRoute } from '@/types/resolved'
import { PropsCallbackContext } from '@/types/props'
import { MaybePromise } from '@/types/utilities'
import RouterView from '@/components/routerView.vue'
import { RouteMeta } from '@/types/register'
import { Param } from '@/types'

export type ToMeta<TMeta extends RouteMeta | undefined> = TMeta extends undefined ? {} : unknown extends TMeta ? {} : TMeta
export type ToState<TState extends Record<string, Param> | undefined> = TState extends undefined ? Record<string, Param> : unknown extends TState ? {} : TState

type ToMatch<
  TOptions extends CreateRouteOptions,
  TProps extends RouteProps<TOptions> | undefined
> = Route<
  ToName<TOptions['name']>,
  Host<'', {}>,
  ToPath<TOptions['path']>,
  ToQuery<TOptions['query']>,
  ToHash<TOptions['hash']>,
  ToMeta<TOptions['meta']>,
  ToState<TOptions['state']>
> & { props: TProps }

type Matches<
  TOptions extends CreateRouteOptions,
  TProps extends RouteProps<TOptions> | undefined
> = TOptions extends { parent: infer TParent extends Route }
  ? [...TParent['matches'], ToMatch<TOptions, TProps>]
  : [ToMatch<TOptions, TProps>]

type ToRoute<
  TOptions extends CreateRouteOptions,
  TProps extends RouteProps<TOptions> | undefined
> = TOptions extends { parent: infer TParent extends Route }
  ? Route<
    ToName<TOptions['name']>,
    Host<'', {}>,
    CombinePath<ToPath<TOptions['path']>, ToPath<TParent['path']>>,
    CombineQuery<ToQuery<TOptions['query']>, ToQuery<TParent['query']>>,
    CombineHash<ToHash<TOptions['hash']>, ToHash<TParent['hash']>>,
    CombineMeta<ToMeta<TOptions['meta']>, ToMeta<TParent['meta']>>,
    CombineState<ToState<TOptions['state']>, ToState<TParent['state']>>,
    Matches<TOptions, TProps>
  >
  : Route<
    ToName<TOptions['name']>,
    Host<'', {}>,
    ToPath<TOptions['path']>,
    ToQuery<TOptions['query']>,
    ToHash<TOptions['hash']>,
    ToMeta<TOptions['meta']>,
    ToState<TOptions['state']>,
    Matches<TOptions, TProps>
  >

type PropsGetter<
  TOptions extends CreateRouteOptions,
  TComopnent extends Component
> = (route: ResolvedRoute<ToRoute<TOptions, undefined>>, context: PropsCallbackContext) => MaybePromise<ComponentProps<TComopnent>>

type ComponentPropsAreOptional<
  TComponent extends Component
> = Partial<ComponentProps<TComponent>> extends ComponentProps<TComponent>
  ? true
  : false

type RoutePropsRecord<
  TOptions extends CreateRouteOptions,
  TComponents extends Record<string, Component>
> = { [K in keyof TComponents as ComponentPropsAreOptional<TComponents[K]> extends true ? K : never]?: PropsGetter<TOptions, TComponents[K]> }
& { [K in keyof TComponents as ComponentPropsAreOptional<TComponents[K]> extends false ? K : never]: PropsGetter<TOptions, TComponents[K]> }

type RouteProps<
  TOptions extends CreateRouteOptions
> = TOptions['component'] extends Component
  ? PropsGetter<TOptions, TOptions['component']>
  : TOptions['components'] extends Record<string, Component>
    ? RoutePropsRecord<TOptions, TOptions['components']>
    : PropsGetter<TOptions, typeof RouterView>

type WithProps<
  TOptions extends CreateRouteOptions,
  TProps extends RouteProps<TOptions>
> = TProps extends PropsGetter<TOptions, Component>
  ? Partial<ReturnType<TProps>> extends ReturnType<TProps>
    ? [ props?: TProps ]
    : [ props: TProps ]
  : Partial<TProps> extends TProps
    ? [ props?: TProps ]
    : [ props: TProps ]

export function createRoute<
  const TOptions extends CreateRouteOptions,
  const TProps extends RouteProps<TOptions>
>(options: TOptions, ...args: WithProps<TOptions, TProps>): ToRoute<TOptions, TProps>

export function createRoute(options: CreateRouteOptions, props?: unknown): Route {
  const id = createRouteId()
  const name = toName(options.name)
  const path = toPath(options.path)
  const query = toQuery(options.query)
  const hash = toHash(options.hash)
  const meta = options.meta ?? {}
  const state = isWithState(options) ? options.state : {}
  const rawRoute = markRaw({ id, meta: {}, state: {}, ...options })

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
