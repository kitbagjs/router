# Context

The `context` option declares route and rejection definitions that callbacks can reference through `push`, `replace`, and `reject`. These helpers are typed from those definitions, including any required route params. When a [router is registered](/core-concepts/type-safety#registration), its routes and rejections are also available.

Child routes inherit their parent's context.

Reusable loaders, views, and hooks also accept a `context` option. Their callback route arguments and navigation helpers combine their declared context with the registered router. Factories returned by `createRouterAssets(router)` combine context with that specific router instead of the registered router.

Routes and rejections supplied through `context` are not included in `router.push` or `router.reject` types unless they are also passed directly to `createRouter` through its routes array or `rejections` option.

`createRouter` discovers context definitions from its routes, including inherited context and context from attached loaders, views, and hooks, so they do not need to be listed separately. Registering a hook on a route or router also registers its context targets. Removing the hook leaves those targets registered.

```ts
const login = createRoute({
  name: 'login',
  path: '/login',
})
const denied = createRejection({ type: 'Denied' })

const checkout = createRoute({
  name: 'checkout',
  path: '/checkout',
  context: [login, denied],
})
  .onBeforeRouteEnter((_to, { push, reject }) => {
    if (!isAuthenticated()) {
      return push('login')
    }

    if (!canCheckout()) {
      reject('Denied')
    }
  })

const router = createRouter([checkout])
```

## Circular type inference

When a callback references the same router being inferred, chaining the callback onto a route definition can cause circular TypeScript inference. Define the route first, then attach the callback separately:

```ts
const logout = createRoute({
  name: 'logout',
  path: '/logout',
})

const router = createRouter([login, logout])

logout.onBeforeRouteEnter((_to, { replace }) => replace('login'))
```
