# Route Meta

It may be useful to store additional context on your route to be used in a hook, or within a component. Meta data might be useful for authorization, analytics, and much more. For example, below we will use route meta to configure the document title per route.

```ts
import { createRoute, createRouter } from '@kitbag/router'

const routes = [
  createRoute({ 
    name: 'home',
    path: '/',
    component: Home,
    meta: {
      pageTitle: 'Kitbag Home'
    }
  }),
  createRoute({ 
    name: 'path',
    path: '/about',
    component: About,
    meta: {
      pageTitle: 'Learn More About Kitbag'
    }
  }),
]

const router = createRouter(routes)

router.onAfterRouteEnter(to => {
  document.title = to.matched.meta.pageTitle
})
```

You might notice that the default type for `pageTitle` is `unknown`. By default meta is `Record<string, unknown>` but can be narrowed with [declaration merging](https://www.typescriptlang.org/docs/handbook/declaration-merging.html).

```ts
declare module '@kitbag/router' {
  interface RouteMeta {
    pageTitle?: string
  }
}
```
