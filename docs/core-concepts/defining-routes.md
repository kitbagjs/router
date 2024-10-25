# Defining Routes

## Basics

Kitbag Router provides `createRoute`, which creates the `Route` types you'll use when creating your router.

```ts
import { createRoute } from '@kitbag/router'

const routes = [
  createRoute({ name: 'home', path: '/', component: Home }),
  createRoute({ name: 'path', path: '/about', component: About }),
]

const router = createRouter(routes)
```

## Nested Routes

When creating a route, you can optionally supply `parent`. This will nest your route under the parent route. Let's create the following route structure

```txt
└── user
    └── profile
    └── settings
        └── keys
        └── notifications
```

```ts
const user = createRoute({
  name: 'user',
  path: '/user',
  component: ...,
})

const profile = createRoute({
  parent: user,
  name: 'profile',
  path: '/profile',
  component: ...,
})

const settings = createRoute({
  parent: user,
  name: 'settings',
  path: '/settings',
  component: ...,
})

const settingsKeys = createRoute({ 
  parent: settings,
  name: 'keys', 
  path: '/keys', 
  component: ... 
})

const settingsNotifications = createRoute({ 
  parent: settings,
  name: 'notifications', 
  path: '/notifications', 
  component: ... 
})
```

Any Route can be a parent, though to have the children components be rendered correctly you need to put a `<router-view />` component somewhere in the parent's template. Alternatively, you can omit `component` from the parent route, since router assumes any route that doesn't explicitly declare a `component` wants to mount `RouterView`.

## Route Names

Providing the `name` property for each route ensures that we have a way of programmatically navigating. This also means that each route must have a unique name, failure to do so will result in a `DuplicateNamesError` being thrown on `createRouter`.

With the example user routes above

```ts
const router = createRouter(routes)

router.push('keys')
```

Learn more about [navigating](/core-concepts/navigating) to routes.

## Case Sensitivity

By default route paths are NOT case sensitive. If you need part of your route to be case sensitive, we recommend using a [Regex Param](/core-concepts/route-params#regexp-params).

## Hash

With the `hash` property, you can assign a static value expected for the route to match. The behavior of the hash is very similar to how Kitbag Router treats the `path`. If a parent and a child both define `hash`, the end result is the concatenation of parent and child values. Unlike the `path` however, `hash` only supports a static `string` value without params.

## External Routes

Kitbag Router supports defining routes that are "external" to your single-page app (SPA). With `createExternalRoute`, you can get all of the benefits of defined routes for routing that takes the user to another website, like perhaps your docs.

```ts
import { createExternalRoute } from '@kitbag/router'

const routerDocs = createExternalRoute({
  host: 'https://router.kitbag.dev',
  name: 'docs',
})

const routerApiDocs = createExternalRoute({
  parent: routerDocs,
  name: 'docs.api',
  path: '/api/[topic]',
})

export const documentationRoutes = [routerDocs, routerApiDocs]
```

Now we can include these routes with all of the internal routes your app already uses.

```ts
import { defineAsyncComponent } from 'vue'
import { createRoute, createRouter } from '@kitbag/router'
import { documentationRoutes } from './documentationRoutes'

export const routes = [
  createRoute({
    name: 'home',
    path: '/',
    component: defineAsyncComponent(() => import('@/views/HomeView.vue')),
  }),
  ...
])

export const router = createRouter([routes, documentationRoutes])
```

Now your router has all the context it needs to not only handle routing between your internal views, but also for sending users to your external docs site.

```ts
import { useRouter } from '@kitbag/router'

const router = useRouter()

function goToTopic(topic: string): void {
  router.push('docs.api', { topic })
}
```

### Host

External routes support route params inside of the `host`, just like `path` and `query`.

```ts
import { createExternalRoute } from '@kitbag/router'

const routerDocs = createExternalRoute({
  host: 'https://[subdomain].kitbag.dev',
  name: 'docs',
})
```
