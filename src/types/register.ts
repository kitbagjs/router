import { Router } from '@/types/router'

export interface Register {
  // router: Router
  // rejections: ['Auth'],
}

export type RegisteredRouter = Register extends { router: infer TRouter }
  ? TRouter
  : Router

export type RegisteredRejection = Register extends { rejections: infer TRejections extends string[] }
  ? TRejections[number]
  : never