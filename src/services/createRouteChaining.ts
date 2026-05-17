import { CreateUrlOptions, ToUrl, Url } from '@/types/url'
import { Component } from 'vue'
import { ComponentProps } from '@/services/component'
import { createUrl } from './createUrl'
import echo from '@/components/echo'
import helloWorld from '@/components/helloWorld'

/** Forces TypeScript to expand an object type for display and inference. */
export type Expand<T> = T extends infer O ? { [K in keyof O]: O[K] } : never

export type AddViewArgs<
  TComponent extends Component,
  TProps = ComponentProps<TComponent>
> = Partial<ComponentProps<TComponent>> extends ComponentProps<TComponent>
  ? [props?: () => TProps]
  : [props: () => TProps]

/** Props getter for a view, or `never` when the component has no required props. */
export type ViewProps<TComponent extends Component> =
  AddViewArgs<TComponent> extends [props: () => infer TProps, ...unknown[]]
    ? () => TProps
    : never

type InferViewProps<
  TComponent extends Component,
  TArgs extends AddViewArgs<TComponent>
> = TArgs extends [props: () => infer TProps, ...unknown[]]
  ? () => TProps
  : never

type MergeViewMaps<
  TViews extends Record<string, unknown>,
  TViewName extends string,
  TViewProps
> = {
  [K in keyof TViews | TViewName]: K extends TViewName
    ? TViewProps
    : K extends keyof TViews
      ? TViews[K]
      : never
}

export type RouteShape<
  TName extends string = string,
  TUrl extends Url = Url,
  TViews extends Record<string, unknown> = {}
> = Expand<{
  name: TName,
  url: Url<TUrl['params']>,
  views: TViews,
}>

export type AddViewToShape<
  TShape extends RouteShape,
  TViewName extends string,
  TComponent extends Component,
  TViewProps = ViewProps<TComponent>
> = Expand<{
  name: TShape['name'],
  url: TShape['url'],
  views: Expand<MergeViewMaps<TShape['views'], TViewName, TViewProps>>,
}>

export type AddViewMethod<TShape extends RouteShape> = {
  <TComponent extends Component, const TArgs extends AddViewArgs<TComponent>>(
    component: TComponent,
    ...args: TArgs
  ): Route<AddViewToShape<TShape, 'default', TComponent, InferViewProps<TComponent, TArgs>>>,
  <TViewName extends string, TComponent extends Component, const TArgs extends AddViewArgs<TComponent>>(
    name: TViewName,
    component: TComponent,
    ...args: TArgs
  ): Route<AddViewToShape<TShape, TViewName, TComponent, InferViewProps<TComponent, TArgs>>>,
}

export type Route<TShape extends RouteShape> = Expand<TShape> & {
  addView: AddViewMethod<TShape>,
}

type ViewRuntime = {
  component: Component,
  props?: () => unknown,
}

function toViewRuntime<TComponent extends Component>(
  component: TComponent,
  props?: () => ComponentProps<TComponent>,
): ViewRuntime {
  if (props !== undefined) {
    return { component, props }
  }

  return { component }
}

function toRoute<TShape extends RouteShape>(route: TShape): Route<TShape> {
  const runtimeViews = route.views as Record<string, ViewRuntime>

  const addView = ((...params: unknown[]) => {
    const [name, component, ...args] = typeof params[0] === 'string' ? params : ['default', ...params]

    const nextRoute = {
      ...route,
      views: {
        ...runtimeViews,
        [name as string]: toViewRuntime(component as Component, args[0] as (() => unknown) | undefined),
      },
    }

    return toRoute(nextRoute as RouteShape)
  }) as AddViewMethod<TShape>

  return { ...route, addView } as Route<TShape>
}

export type CreateRouteOptions<
  TName extends string = string,
  TUrlOptions extends CreateUrlOptions = CreateUrlOptions
> = { name: TName } & TUrlOptions

export function createRoute<
  const TName extends string,
  const TUrlOptions extends CreateUrlOptions
>(options: CreateRouteOptions<TName, TUrlOptions>): Route<Expand<RouteShape<TName, ToUrl<TUrlOptions>>>> {
  const { name, ...urlOptions } = options

  return toRoute({
    name,
    url: createUrl(urlOptions),
    views: {},
  } as unknown as Expand<RouteShape<TName, ToUrl<TUrlOptions>>>)
}

const route = createRoute({ name: 'home', path: '/' })
  .addView(echo, () => ({ value: 'hello' }))
  .addView('sidebar', helloWorld)
