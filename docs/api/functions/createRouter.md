# Functions: createRouter()

## Call Signature

```ts
function createRouter<TRoutes, TOptions>(routes, options?): Router<TRoutes, TOptions>
```

Creates a router instance for a Vue application, equipped with methods for route handling, lifecycle hooks, and state management.

### Type Parameters

| Type Parameter |
| ------ |
| `TRoutes` *extends* [`Routes`](../types/Routes.md) |
| `TOptions` *extends* [`RouterOptions`](../types/RouterOptions.md) |

### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `routes` | `TRoutes` | [Routes](../types/Routes.md) An array of route definitions specifying the configuration of routes in the application. Use createRoute method to create the route definitions. |
| `options`? | `TOptions` | [RouterOptions](../types/RouterOptions.md) for the router, including history mode and initial URL settings. |

### Returns

[`Router`](../types/Router.md)\<`TRoutes`, `TOptions`\>

Router instance

### Example

```ts
import { createRoute, createRouter } from '@kitbag/router'

const Home = { template: '<div>Home</div>' }
const About = { template: '<div>About</div>' }

export const routes = [
  createRoute({ name: 'home', path: '/', component: Home }),
  createRoute({ name: 'path', path: '/about', component: About }),
] as const

const router = createRouter(routes)
```

## Call Signature

```ts
function createRouter<TRoutes, TOptions>(arrayOfRoutes, options?): Router<TRoutes, TOptions>
```

Creates a router instance for a Vue application, equipped with methods for route handling, lifecycle hooks, and state management.

### Type Parameters

| Type Parameter |
| ------ |
| `TRoutes` *extends* [`Routes`](../types/Routes.md) |
| `TOptions` *extends* [`RouterOptions`](../types/RouterOptions.md) |

### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `arrayOfRoutes` | `TRoutes`[] | - |
| `options`? | `TOptions` | [RouterOptions](../types/RouterOptions.md) for the router, including history mode and initial URL settings. |

### Returns

[`Router`](../types/Router.md)\<`TRoutes`, `TOptions`\>

Router instance

### Example

```ts
import { createRoute, createRouter } from '@kitbag/router'

const Home = { template: '<div>Home</div>' }
const About = { template: '<div>About</div>' }

export const routes = [
  createRoute({ name: 'home', path: '/', component: Home }),
  createRoute({ name: 'path', path: '/about', component: About }),
] as const

const router = createRouter(routes)
```
