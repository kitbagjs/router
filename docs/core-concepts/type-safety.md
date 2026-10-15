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
  createView,
  createHook,
} = createRouterAssets(router)
```

## Circular type inference

::: warning
Using a loader or view in the router that supplies its types creates circular type inference. Annotate it with `Loader<Data>` or `View<Props>` to resolve this.
:::

```ts
import { createLoader, type Loader } from '@kitbag/router'
import { getSession, type Session } from './api'

const sessionLoader: Loader<Promise<Session>> = createLoader({
  load: () => getSession(),
})
```

```ts
import { createView, type View } from '@kitbag/router'
import PageComponent from './PageComponent.vue'

const pageView: View<{ url: string }> = createView({
  component: PageComponent,
  props: (route) => ({ url: String(route.href) }),
})
```
