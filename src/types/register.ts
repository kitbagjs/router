import { Router } from '@/types/router'

export interface Register {
  // router: Router
}

export type RegisteredRouter = Register extends { router: infer TRouter }
  ? TRouter
  : Router