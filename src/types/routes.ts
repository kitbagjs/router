import { Path } from '@/utilities/path'

export type ParentRoute<
  TRoute extends string | Path = any
> = {
  name?: string,
  path: TRoute,
  public?: false,
  children: Routes,
}

export type ChildRoute<
  TRoute extends string | Path = any
> = {
  name: string,
  public?: false,
  path: TRoute,
}

export type Route<
  TRoute extends string | Path = any
> = ParentRoute<TRoute> | ChildRoute<TRoute>

export type Routes = Readonly<(ParentRoute | ChildRoute)[]>