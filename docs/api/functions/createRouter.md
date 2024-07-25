# createRouter

```ts
function createRouter<T>(routes, options?): Router<T>
```

Creates a router instance for a Vue application, equipped with methods for route handling, lifecycle hooks, and state management.

## Type parameters

| Type parameter |
| :------ |
| `T` *extends* readonly [`Route`](../types/Route)[] |

## Parameters

| Parameter | Type | Description |
| :------ | :------ | :------ |
| `routes` | `T` | [Routes](../types/Routes) An array of route definitions specifying the configuration of routes in the application. Use `createRoute` or `createExternalRoute` method to create the route definitions. |
| `options`? | [`RouterOptions`](../types/RouterOptions) | [RouterOptions](../types/RouterOptions) for the router, including history mode and initial URL settings. |

## Returns

[`Router`](../types/Router)\<`T`\>

Router instance

## Example

```ts
import { createRoute, createRouter } from '@kitbag/router'

const Home = { template: '<div>Home</div>' }
const About = { template: '<div>About</div>' }

export const routes = [
  createRoute({ name: 'home', path: '/', component: Home }),
  createRoute({ name: 'path', path: '/about', component: About }),
]

const router = createRouter(routes)
```
