# Route Narrowing
When accessing the current route, by default the type is a union of all possible routes. 

```ts
import { createRoutes, createRouter } from '@kitbag/router'

const routes = createRoutes([
  {
    name: 'home',
    path: '/',
    component: ...,
  },
  {
    name: 'user',
    path: '/user/[userId]',
    component: ...,
    children: createRoutes([
      {
        name: 'profile',
        path: '/profile',
        query: '?tab=[tab]',
        component: ...,
      },
      {
        name: 'settings',
        path: '/settings',
        component: ...,
      }
    ])
  }
])

const router = createRouter(routes)

router.route.key // "home" | "user" | "user.profile" | "user.settings"
```

This can be narrowed like any union in Typescript, by checking the route key.

```ts
if(router.route.key === 'user') {
  router.route.key // "user"
  router.route.params // { userId: string }
}
```

You can also use the `isRoute` type guard. You could write the same logic as above like this.

```ts
if(router.route, 'user', { exact: true }) {
  router.route.key // "user"
  router.route.params // { userId: string }
}
```

Its recommended to use the `isRoute` type guard because it offers more flexibility by its use of `exact`. 

```ts
if(router.route, 'user', { exact: false }) {
  router.route.key // "user" | "user.profile" | "user.settings"
  router.route.params // { userId: string } | { userId: string, tab: string }
```

The `exact` option is optional and defaults to `false`.

```ts
if(router.route, 'user') {
  router.route.key // "user" | "user.profile" | "user.settings"
  router.route.params // { userId: string } | { userId: string, tab: string }
}
```
