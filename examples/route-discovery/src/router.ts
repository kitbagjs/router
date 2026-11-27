import { createRouter } from '@kitbag/router'
import { routes } from './routes.generated'

export const router = createRouter(routes)

declare module '@kitbag/router' {
  interface Register {
    router: typeof router,
  }
}
