import { RouterRoute } from '@/types/routerRoute'

export type RouteMatchRule = (route: RouterRoute, url: string) => boolean