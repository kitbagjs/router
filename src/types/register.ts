import { NotFound } from '@/components'
import { Router } from '@/types/router'
import { RouteComponent } from '@/types/routes'

export interface Register {
  // router: Router
  // rejections: ['Auth'],
}

export type RegisteredRouter = Register extends { router: infer TRouter }
  ? TRouter
  : Router

export const builtInRejections = ['NotFound'] as const
export type BuiltInRejection = typeof builtInRejections[number]

export const builtInRejectionComponents: Record<BuiltInRejection, RouteComponent> = {
  NotFound,
}

export type RegisteredRejections = Register extends { rejections: infer TRejections extends string[] }
  ? TRejections[number]
  : never