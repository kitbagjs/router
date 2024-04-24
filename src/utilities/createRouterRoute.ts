import { readonly } from 'vue'
import { ResolvedRoute, RouterRoute } from '@/types'

export function createRouterRoute(route: ResolvedRoute): RouterRoute {
  return readonly(route)
}