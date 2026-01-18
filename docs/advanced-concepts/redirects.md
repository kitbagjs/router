# Redirects

Redirects provide a declarative way to automatically redirect from one route to another. This is useful for handling URL migrations or implementing redirect logic based on route parameters.

## Route Redirects

Route redirects allow you to define redirect relationships between routes. When a user navigates to a route that has a redirect configured, the router will automatically redirect them to the target route.

There are two methods available on route objects for creating redirects:

- **`redirectTo`**: Redirects the current route to another route
- **`redirectFrom`**: Redirects from another route to the current route

## Basic Usage

### Using `redirectTo`

The `redirectTo` method is called on the source route (the route you want to redirect from) and takes the destination route as an argument.

```ts
import { createRoute, createRouter } from '@kitbag/router'

const home = createRoute({
  name: 'home',
  path: '/home',
})

const dashboard = createRoute({
  name: 'dashboard',
  path: '/dashboard',
})

// Redirect from 'home' to 'dashboard'
home.redirectTo(dashboard)
```

### Using `redirectFrom`

The `redirectFrom` method is called on the destination route (the route you want to redirect to) and takes the source route as an argument.

```ts
import { createRoute, createRouter } from '@kitbag/router'

const home = createRoute({
  name: 'home',
  path: '/home',
})

const dashboard = createRoute({
  name: 'dashboard',
  path: '/dashboard',
})

// Redirect from 'home' to 'dashboard'
dashboard.redirectFrom(home)
```

Both approaches achieve the same result. Choose the one that feels more natural for your use case:
- Use `redirectTo` when you're working with the source route and want to specify where it should redirect
- Use `redirectFrom` when you're working with the destination route and want to specify which routes should redirect to it

## Parameters

When redirecting between routes with parameters, you can provide a callback function to convert parameters from the source route to the destination route.

### Converting Path Parameters

```ts
import { createRoute, createRouter } from '@kitbag/router'

const oldPost = createRoute({
  name: 'old-post',
  path: '/blog/[blogId]',
})

const newPost = createRoute({
  name: 'new-post',
  path: '/articles/[articleId]',
})

// Convert 'blogId' parameter to 'articleId'
oldPost.redirectTo(newPost, ({ blogId }) => {
  return { articleId: blogId }
})
```

## Restrictions

### One Redirect Per Route

Each route can only have one redirect configured. Attempting to configure multiple redirects for the same route will throw a `MultipleRouteRedirectsError`.

```ts
import { createRoute } from '@kitbag/router'

const routeA = createRoute({ name: 'a', path: '/a' })
const routeB = createRoute({ name: 'b', path: '/b' })
const routeC = createRoute({ name: 'c', path: '/c' })

routeA.redirectTo(routeB)

// This will throw MultipleRouteRedirectsError
routeA.redirectTo(routeC) // ❌ Error (routeA already redirects to routeB)
routeB.redirectFrom(routeA) // ❌ Error (routeA already redirects to routeB)
```
