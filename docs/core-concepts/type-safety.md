# Type Safety

Use router registration to type imports from `@kitbag/router`, or create router assets for a specific router. Both approaches provide route names, params, and loader data types from your route definitions.

## Registration

Extend the `Register` interface with your router's type. Components, composables, and reusable callbacks imported from `@kitbag/router` will then use that router's types.

```ts
import { createRouter } from '@kitbag/router'
import { routes } from './routes'

export const router = createRouter(routes)

declare module '@kitbag/router' {
  interface Register {
    router: typeof router
  }
}
```

## Router Assets

Use [`createRouterAssets`](/api/functions/createRouterAssets) to get exports typed for a specific router, such as when an application uses multiple routers. Import the resulting exports from your own module instead of `@kitbag/router`.

```ts
// routerAssets.ts
import { createRouterAssets } from '@kitbag/router'
import { router } from './router'

export const {
  RouterLink,
  RouterView,
  useRoute,
  useRouter,
  createLoader,
} = createRouterAssets(router)
```

If assets are needed before the router is created, pass an injection key and supply the router's type explicitly. Pass the same key to `createRouter(routes, { key: routerKey })`.

```ts
// routerAssets.ts
import { createRouterAssets } from '@kitbag/router'
import type { router } from './router'

export const routerKey = Symbol('router')
export const { useRoute, createLoader } = createRouterAssets<typeof router>(routerKey)
```

## Circular type inference

::: warning
Using a loader in the router that supplies its types creates circular type inference. Annotate it with `Loader<Data>` to resolve this.
:::

```ts
import { createLoader, type Loader } from '@kitbag/router'
import { getSession, type Session } from './api'

const sessionLoader: Loader<Promise<Session>> = createLoader({
  load: () => getSession(),
})
```

