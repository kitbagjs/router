# Context

The `context` option declares route and rejection definitions that callbacks can reference through `push`, `replace`, and `reject`. These helpers are typed from those definitions, including any required route params.

Child routes inherit their parent's context.

Routes and rejections supplied through `context` are not included in `router.push` or `router.reject` types unless they are also passed directly to `createRouter` through its routes array or `rejections` option.

`createRouter` discovers context definitions from its routes, including inherited context, so they do not need to be listed separately.

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
