import { Router } from '@/types/router'
import { component, createRouter, createRoutes } from '@/utilities'

const routes = createRoutes([
  {
    name: 'first',
    component,
    path: '/first',
  },
  {
    name: 'second',
    component,
    path: '/second',
  },
  {
    name: 'third',
    component,
    path: '/third/:id',
  },
])
export interface Register {
  router: Router<typeof routes>,
  // rejections: ['Auth'],
  // state: {}
}

export type RegisteredRouter = Register extends { router: infer TRouter }
  ? TRouter
  : Router

export type RegisteredRoutes = RegisteredRouter extends { router: Router<infer Routes> }
  ? Routes
  : []

export type RegisteredRejectionType = Register extends { rejections: infer TRejections extends string[] }
  ? TRejections[number]
  : never

export type RegisteredRouterState = Register extends { state: infer TState }
  ? TState
  : {}