import { Path } from '@/utilities/path'

export type ParentRoute<
  TRoute extends string | Path = any
> = {
  name?: string,
  path: TRoute,
  children: Routes,
}

export type ChildRoute<
  TRoute extends string | Path = any
> = {
  name: string,
  path: TRoute,
}

export type Route<
  TRoute extends string | Path = any
> = ParentRoute<TRoute> | ChildRoute<TRoute>

export type Routes = Readonly<(ParentRoute | ChildRoute)[]>