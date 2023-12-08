import { Path } from '@/utilities/path'

export type ParentRoute<
  TRoute extends string | Path = any
> = {
  name?: string,
  path: TRoute,
  public?: boolean,
  children: Routes,
}

export type ChildRoute<
  TRoute extends string | Path = any
> = {
  name: string,
  public?: boolean,
  path: TRoute,
}

export type Route<
  TRoute extends string | Path = any
> = ParentRoute<TRoute> | ChildRoute<TRoute>

export type Routes = Readonly<(ParentRoute | ChildRoute)[]>

export function isParentRoute(value: Route): value is ParentRoute {
  return 'children' in value
}

export function isNamedRoute(value: Route): value is Route & { name: string } {
  return 'name' in value && !!value.name
}