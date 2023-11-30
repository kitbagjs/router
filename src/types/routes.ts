import { Path } from '@/utilities/path'

export type Route<
  TRoute extends string | Path = any
> = {
  name: string,
  path: TRoute,
  children?: Routes,
}

export type RouteWithChildren = Route & {
  children: Routes,
}

export type Routes = Readonly<Route[]>