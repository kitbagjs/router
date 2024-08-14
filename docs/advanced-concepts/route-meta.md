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
] as const

const router = createRouter(routes)

router.onAfterRouteEnter(to => {
  document.title = to.matched.meta.pageTitle
})
```

## Meta Type

Types for meta defined on individual routes will just work. If you want to require certain properties be set on all routes, you can update the global type with [declaration merging](https://www.typescriptlang.org/docs/handbook/declaration-merging.html).

```ts
declare module '@kitbag/router' {
  interface Register {
    routeMeta: {
      pageTitle?: string
    }
  }
}
```

## Cascading Meta

Meta will automatically cascade from parent routes down through child routes.

```ts
const parent = createRoute({ 
  name: 'parent',
  meta: {
    public: true
  }
})

const child = createRoute({ 
  parent,
  name: 'child',
})

// child has 'public: true'
child.meta.public
```

### Meta Property Conflict

Unlike other cascading properties like params, a child **can** also define duplicate keys in meta. However, in order for the types to be accurate child properties must match the `typeof` on the parent meta. When the router finds a duplicate key with conflicting types it will throw a [MetaPropertyConflict](../api//errors/MetaPropertyConflict) error.
