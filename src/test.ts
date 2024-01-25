/* eslint-disable no-unused-vars */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { ExtractRouteMethodParams, Public, Route, RouteComponent, Routes } from '@/types'
import { createRouter } from '@/utilities/createRouter'
import { component } from '@/utilities/testHelpers'

function routesFactory<const T extends string, const R extends Routes>(prefix: T, children: R) {
  const routes = [
    {
      name: `${prefix}One`,
      path: `/:${prefix}One/:${prefix}BOne/:${prefix}COne/:foo`,
      component,
      children,
    },
    {
      name: `${prefix}Two`,
      path: `/:${prefix}Two/:${prefix}BTwo/:${prefix}CTwo/:foo`,
      component,
      children,
    },
    {
      name: `${prefix}Three`,
      path: `/:${prefix}Three/:${prefix}BThree/:${prefix}CThree/:foo`,
      component,
      children,
    },
    {
      name: `${prefix}Four`,
      path: `/:${prefix}Four/:${prefix}BFour/:${prefix}CFour/:foo`,
      component,
      children,
    },
    {
      name: `${prefix}Five`,
      path: `/:${prefix}Five/:${prefix}BFive/:${prefix}CFive/:foo`,
      component,
      children,
    },
    {
      name: `${prefix}Six`,
      path: `/:${prefix}Six/:${prefix}BSix/:${prefix}CSix/:foo`,
      component,
      children,
    },
    {
      name: `${prefix}Seven`,
      path: `/:${prefix}Seven/:${prefix}BSeven/:${prefix}CSeven/:foo`,
      component,
      children,
    },
    {
      name: `${prefix}Eight`,
      path: `/:${prefix}Eight/:${prefix}BEight/:${prefix}CEight/:foo`,
      component,
      children,
    },
    {
      name: `${prefix}Nine`,
      path: `/:${prefix}Nine/:${prefix}BNine/:${prefix}CNine/:foo`,
      component,
      children,
    },
    {
      name: `${prefix}Ten`,
      path: `/:${prefix}Ten/:${prefix}BTen/:${prefix}CTen/:foo`,
      component,
      children,
    },
  ] as const satisfies Routes

  return routes
}

const routes = [
  ...routesFactory('A', routesFactory('G', [{ name: 'L', path: '/C', component }])),
  ...routesFactory('C', routesFactory('H', [{ name: 'M', path: '/C', component }])),
  ...routesFactory('D', routesFactory('I', [{ name: 'N', path: '/C', component }])),
  // ...routesFactory('E', routesFactory('J', [{ name: 'O', path: '/C', component }])),
  // ...routesFactory('F', routesFactory('K', routesFactory('P', [{ name: 'Q', path: '/C', component }]))),
] as const satisfies Routes

const router = createRouter(routes)

type MyRoutes = typeof router.routes
type Keys = RouteKeys<typeof routes>

function test<T extends string>(_route: T & Keys, _params: ExtractRouteKeyParameters<MyRoutes, T>): void {

}

function test2<T extends string>(_args: { route: T & Keys, params: ExtractRouteKeyParameters<MyRoutes, T> }): void {

}

type ExtractRouteKeyParameters<
  TRoutes,
  TRouteKey
> = TRouteKey extends string ? NestedObjectValue<TRoutes, TRouteKey> : never

type NestedObjectValue<
  T,
  K extends string
> =
  K extends `${infer F}.${infer R}`
    ? F extends keyof T
      ? NestedObjectValue<T[F], R>
      : never
    : K extends keyof T
      ? ExtractRouteMethodParams<T[K]>
      : never

type AnyRoute = { name: string, path: string, component: RouteComponent }
type AnyRoutes = Readonly<AnyRoute[]>

type RouteKeys<
  TRoutes extends AnyRoutes,
  TPrefix extends string = ''
> = FlatArray<{
  [K in keyof TRoutes]: TRoutes[K] extends Route
    ? [RouteKey<TRoutes[K], TPrefix>, ChildrenKeys<TRoutes[K], TPrefix>]
    : never
}, 1>

type RouteKey<
  TRoute extends AnyRoute,
  TPrefix extends string
> = TRoute extends Public<TRoute> & { name: infer Name extends string }
  ? Prefix<TPrefix, Name>
  : never

type ChildrenKeys<
  TRoute extends Route,
  TPrefix extends string
> = TRoute extends { children: infer Children extends AnyRoutes }
  ? TRoute extends { name: infer Name extends string }
    ? RouteKeys<Children, Prefix<TPrefix, Name>>
    : never
  : never

type Prefix<
  TParentName extends string,
  TChildName extends string
> = `${TChildName}${TParentName}` extends ''
  ? ''
  : TParentName extends ''
    ? TChildName
    : TChildName extends ''
      ? TParentName
      : `${TParentName}.${TChildName}`