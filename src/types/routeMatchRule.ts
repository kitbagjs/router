import { Route } from '@/types/route'

export type RouteMatchRule = (route: Route, url: string) => boolean
