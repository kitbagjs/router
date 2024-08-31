# Route Narrowing

When accessing the current route, by default the type is a union of all possible routes.

```ts
import { createRoute, createRouter } from '@kitbag/router'

const home = createRoute({
  name: 'home',
  path: '/',
  component: ...,
})

const user = createRoute({
  name: 'user',
  path: '/user/[userId]',
  component: ...,
})

const profile = createRoute({
  parent: user,
  name: 'user.profile',
  path: '/profile',
  query: '?tab=[tab]',
  component: ...,
})

const settings = createRoute({
  parent: user,
  name: 'user.settings',
  path: '/settings',
  component: ...,
})

const router = createRouter([home, user, profile, settings])

router.route.name // "home" | "user" | "profile" | "settings"
```

This can be narrowed like any union in Typescript, by checking the route name.

```ts
if(router.route.name === 'user') {
  router.route.name // "user"
  router.route.params // { userId: string }
}
```

You can also use the `isRoute` type guard. You could write the same logic as above like this.

```ts
if(router.route, 'user', { exact: true }) {
  router.route.name // "user"
  router.route.params // { userId: string }
}
```

The `isRoute` type guard offers more flexibility with the optional `exact` argument, which defaults to `false` and will return narrow to the target route or any of it's descendants. 

```ts
if(router.route, 'user', { exact: false }) {
  router.route.name // "user" | "user.profile" | "user.settings"
  router.route.params // { userId: string } | { userId: string, tab: string }
