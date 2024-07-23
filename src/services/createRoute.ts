/* eslint-disable @typescript-eslint/no-unused-vars */
import { Component } from 'vue'
import { CombineName } from '@/services/combineName'
import { CombinePath } from '@/services/combinePath'
import { CombineQuery } from '@/services/combineQuery'
import { AfterRouteHook, BeforeRouteHook } from '@/types/hooks'
import { Host } from '@/types/host'
import { ExtractParamTypes, MergeParams } from '@/types/params'
import { Path, ToPath } from '@/types/path'
import { Query, ToQuery } from '@/types/query'
import { RouteMeta } from '@/types/register'
import { Route } from '@/types/route'
import { MaybeArray } from '@/types/utilities'

/**
 * Defines route hooks that can be applied before entering, updating, or leaving a route, as well as after these events.
 */
type WithHooks = {
  onBeforeRouteEnter?: MaybeArray<BeforeRouteHook>,
  onBeforeRouteUpdate?: MaybeArray<BeforeRouteHook>,
  onBeforeRouteLeave?: MaybeArray<BeforeRouteHook>,
  onAfterRouteEnter?: MaybeArray<AfterRouteHook>,
  onAfterRouteUpdate?: MaybeArray<AfterRouteHook>,
  onAfterRouteLeave?: MaybeArray<AfterRouteHook>,
}

type WithComponent = {
  /**
   * A Vue component, which can be either synchronous or asynchronous components.
   */
  component: Component,
}

type WithComponents = {
  /**
   * Multiple components for named views, which can be either synchronous or asynchronous components.
   */
  components: Record<string, Component>,
}

type WithComponentCallback<Params> = {
  loadComponent: (params: Params) => any,
}

/**
 * Type guard function to determine if a given route configuration is a parent route, based on the presence of children.
 * @param value - The route configuration to check.
 * @returns True if the route configuration has children, indicating it is a parent route.
 */
export function isParentRoute(value: CreateRouteOptions): value is CreateRouteOptions {
  return 'children' in value
}

export function isParentRouteWithoutComponent(value: CreateRouteOptions): value is Omit<CreateRouteOptions, 'component' | 'components'> {
  return isParentRoute(value) && !('component' in value) && !('components' in value)
}

export function isRouteWithComponent(value: CreateRouteOptions): value is CreateRouteOptions & WithComponent
export function isRouteWithComponent(value: Readonly<CreateRouteOptions>): value is Readonly<CreateRouteOptions & WithComponent>
export function isRouteWithComponent(value: unknown): boolean {
  return typeof value === 'object' && value !== null && 'component' in value
}

export function isRouteWithComponents(value: CreateRouteOptions): value is CreateRouteOptions & WithComponents
export function isRouteWithComponents(value: Readonly<CreateRouteOptions>): value is Readonly<CreateRouteOptions & WithComponents>
export function isRouteWithComponents(value: unknown): boolean {
  return typeof value === 'object' && value !== null && 'components' in value
}

type ParentPath<TParent extends Route | undefined> = TParent extends Route ? TParent['path'] : Path<'', {}>
type ParentQuery<TParent extends Route | undefined> = TParent extends Route ? TParent['query'] : Query<'', {}>
type ComponentCallbackParams<TCombinedPath extends Path, TCombinedQuery extends Query> = ExtractParamTypes<MergeParams<TCombinedPath['params'], TCombinedQuery['params']>>

export type CreateRouteOptions<
  TName extends string | undefined = string,
  TPath extends string | Path | undefined = string | Path | undefined,
  TQuery extends string | Query | undefined = string | Query | undefined,
  TParent extends Route | undefined = undefined
> = Partial<WithComponent | WithComponents | WithComponentCallback<ComponentCallbackParams<CombinePath<ParentPath<TParent>, ToPath<TPath>>, CombineQuery<ParentQuery<TParent>, ToQuery<TQuery>>>>> & WithHooks & {
  /**
   * Name for route, used to create route keys and in navigation.
   */
  name?: TName,
  /**
   * Path part of URL.
   */
  path?: TPath,
  /**
   * Query (aka search) part of URL.
   */
  query?: TQuery,
  /**
   * Represents additional metadata associated with a route, customizable via declaration merging.
   */
  meta?: RouteMeta,
  // will be removed in follow-up PR
  disabled?: boolean,
}

type CreateRouteOptionsWithoutParent<
  TName extends string | undefined = undefined,
  TPath extends string | Path | undefined = undefined,
  TQuery extends string | Query | undefined = undefined
> = CreateRouteOptions<TName, TPath, TQuery> & {
  parent?: never,
}

type CreateRouteOptionsWithParent<
  TParent extends Route,
  TName extends string | undefined = undefined,
  TPath extends string | Path | undefined = undefined,
  TQuery extends string | Query | undefined = undefined
> = CreateRouteOptions<TName, TPath, TQuery, TParent> & {
  parent: TParent,
}

export function createRoute<
  TName extends string | undefined = undefined,
  TPath extends string | Path | undefined = undefined,
  TQuery extends string | Query | undefined = undefined
>(options: CreateRouteOptionsWithoutParent<TName, TPath, TQuery>): Route<TName extends string ? TName : '', Host<'', {}>, ToPath<TPath>, ToQuery<TQuery>>

export function createRoute<
  TParent extends Route,
  TName extends string | undefined = undefined,
  TPath extends string | Path | undefined = undefined,
  TQuery extends string | Query | undefined = undefined
>(options: CreateRouteOptionsWithParent<TParent, TName, TPath, TQuery>): Route<CombineName<TParent['key'], TName extends string ? TName : ''>, Host<'', {}>, CombinePath<TParent['path'], ToPath<TPath>>, CombineQuery<TParent['query'], ToQuery<TQuery>>>

export function createRoute(_options: any): Route {
  throw 'not implemented'
}

// const parent = createRoute({
//   name: 'parent',
//   path: path('/[parent]', { parent: Boolean }),
//   loadComponent: (params) => {
//     //            ^?
//   },
// })

// const child = createRoute({
//   parent,
//   name: 'child',
//   path: path('/[child]', {}),
//   loadComponent: (params) => {
//     //             ^?
//   },
// })

// const grandchild = createRoute({
//   parent: child,
//   name: 'grandchild',
//   path: path('/[grandchild]', { grandchild: Number }),
//   loadComponent: (params) => {
//     //             ^?
//   },
// })

// const router = createRouter([
//   child,
//   grandchild,
// ])
