# Context

Routes, loaders, views, and hooks accept a `context` option containing the route and rejection definitions their callbacks can reference through `push`, `replace`, and `reject`. These helpers are typed from those definitions, including any required route params.

Child routes inherit their parent's context. Reusable loaders, views, and hooks use their own declared context for their navigation helpers.

`createRouter` discovers these definitions from its routes, including inherited context and context from attached loaders, views, and hooks, so they do not need to be listed separately. Register hooks before calling `createRouter`.

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

checkout.onBeforeRouteEnter((_to, { push, reject }) => {
  if (!isAuthenticated()) {
    return push('login')
  }

  if (!canCheckout()) {
    reject('Denied')
  }
})

const router = createRouter([checkout])
```
