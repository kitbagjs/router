# Rejections

A rejection is a destination selected by name, without requiring a URL pattern. `createRejection` returns a route definition, so rejections support the same views, loaders, titles, and lifecycle hooks as routes.

## Create a rejection

```ts
import { createRejection, createRoute, createRouter } from '@kitbag/router'
import LoginView from '@/views/LoginView.vue'

const authNeeded = createRejection({
  type: 'AuthNeeded',
  status: 401,
  component: LoginView,
})

const account = createRoute({
  name: 'account',
  path: '/account',
  context: [authNeeded],
})

export const router = createRouter([account, authNeeded])
```

`type` supplies the definition's `name`. Routes and rejections share one namespace, so their names must be unique. You can also register rejections through `options.rejections` or a router plugin.

The optional `status` is the HTTP status returned by [router.render](/core-concepts/router#render). It defaults to `200`. The built-in `NotFound` rejection declares `404`.

If you omit `component`, the router supplies a default rejection component.

## Trigger a rejection

A hook, loader, or props callback can use its context's `reject` function. Declare custom rejections in the route's `context` to make them available to its callbacks.

```ts
account.onBeforeRouteEnter((_to, { reject }) => {
  if (!isAuthenticated()) {
    reject('AuthNeeded')
  }
})
```

Outside a callback, use `router.reject`:

```ts
await router.reject('AuthNeeded')
```

Like `push` and `replace`, `reject` returns `Promise<void>`. It waits for navigation and after hooks; loaders can continue asynchronously. `router.push('AuthNeeded')` also selects the registered destination by name.

A rejection keeps the address of the attempted navigation. A manual rejection keeps the current address. Neither requires a matching URL route.

## Navigation lifecycle

Every destination uses the same before, after, and error hooks. The current destination's leave hooks receive the rejection as `to`. The rejection's own enter hooks receive its resolved route.

```ts
authNeeded.onAfterRouteEnter((to, { from }) => {
  console.log(to.name, from?.name)
})

authNeeded.onBeforeRouteLeave((_to, { abort }) => {
  if (hasUnsavedChanges()) {
    abort()
  }
})
```

When a hook redirects or rejects, the replacement navigation cancels the interrupted navigation and starts a new hook pass. This includes leave hooks. Scope guards to the destinations they protect; an unconditional global rejection would reject its own replacement too.

```ts
router.onBeforeRouteEnter((to, { reject }) => {
  if (to.name === 'account' && !isAuthenticated()) {
    reject('AuthNeeded')
  }
})
```

Route-owned enter and update hooks still know their own route type. In a route-owned leave hook, `from` is still that route's type. Global hooks include all registered destinations, including `NotFound`, in their name union.

## Views and loaders

Rejections can use `addLoader` and `addView` just like other route definitions. View matching follows the same depth and name rules: a default view renders in the default outlet, and named outlets require named views.

```ts
const unavailable = createRejection({ type: 'Unavailable', status: 503 })
  .addLoader(() => fetchServiceStatus())
  .addView(StatusView, {
    props: async (route) => ({ status: await route.data }),
  })
  .addView(StatusSidebar, { name: 'sidebar' })
```

Rejection data uses the same progress tracking and server payload as route data. Hydration adopts the server's selected rejection and its data, including when the address matches no URL route.

A rejection can also declare an explicit URL with `addAlias({ path: '/unavailable' })`. Its status, loaders, and hooks work the same whether it is selected by that address or by `reject`.

## Current destination

`router.route` and `useRoute()` describe the displayed destination. After a rejection, its `name`, `status`, `matches`, and `data` describe the rejection. Its `href`, query, and hash describe the address being displayed.

Within a route component, `useRoute('account')` still gives you that route's type directly. For code that observes any current destination, narrow by name:

```ts
if (router.route.name === 'account') {
  // Access account-specific params or data here.
}
```

`useRejection()` is a read-only ref containing the current rejection definition, or `null` for a normal route. Use `router.reject()` to change destinations.

```ts
const rejection = useRejection()
const rejectionName = computed(() => rejection.value?.name)
```

## Built-in NotFound

The router selects `NotFound` when an address matches no route. Override it by registering your own rejection with the same name:

```ts
const notFound = createRejection({
  type: 'NotFound',
  status: 404,
  component: NotFoundPage,
})

const router = createRouter([account, authNeeded, notFound])
```

An unmatched address uses the same navigation lifecycle as a manual rejection. Leave hooks can delay or cancel it, the rejection's enter hooks run, and progress tracks its assets.

## Title

Use `setTitle` as you would on a route. Its callback receives the resolved rejection destination, including the current address.

```ts
authNeeded.setTitle((to) => `Sign in — ${to.href}`)
```

A destination without a title leaves the existing browser document title alone. Server rendering returns `undefined` when the selected destination has no title.

## Migration from separate rejections

- Replace `rejection.onRejection(...)` with `rejection.onAfterRouteEnter(...)`. Replace `router.onRejection(...)` with a standard router hook that checks the destination name. Hook arguments are now `(to, context)`; `to` is the selected destination and `context.from` is the destination being left.
- Read `rejection.name` instead of `rejection.type`. The `createRejection` input still uses `type`.
- `router.route` includes the displayed rejection rather than retaining the previous successful route. Narrow by `name` before accessing route-specific params or data.
- `router.reject` is asynchronous. Await it when subsequent work depends on the committed destination.
- Replace writes to `useRejection().value` with navigation calls.
- Declare named rejection views explicitly. The default rejection component no longer repeats in every named or nested outlet.
- Replace the router's `rejectStatus` option with `status` on each rejection definition. Ordinary routes also accept `status`.
- Give routes and rejections distinct names. A custom `NotFound` rejection still replaces the built-in definition.
- Guards run again for replacement destinations. Scope global guards and leave hooks so they can allow their rejection destination.

The rejection-specific hook types have been removed; use the corresponding standard hook types. A rejection's title is read from its resolved destination through `router.route.getTitle()`.
