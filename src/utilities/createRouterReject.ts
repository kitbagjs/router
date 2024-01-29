import { NotFound } from '@/components'
import { RegisteredRejection, RouteComponent } from '@/types'

export const builtInRejections = ['NotFound'] as const
export type BuiltInRejection = typeof builtInRejections[number]

export const builtInRejectionComponents: Record<BuiltInRejection, RouteComponent> = {
  NotFound,
}

export type RouterRejection = BuiltInRejection | RegisteredRejection

export type RouterReject = (type: RouterRejection) => void

export function createRouterReject(): RouterReject {
  return (type) => {

  }
}