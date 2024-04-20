import { Route } from '@/types/routerRoute'

export type RouteMatchRule = (route: Route, url: string) => boolean