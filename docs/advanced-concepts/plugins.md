# Plugins

Plugins are a way to extend the router with additional functionality. They are used to add routes and rejections to the router.

```ts
import { createRejection, createRoute, createRouterPlugin } from '@kitbag/router'

const routes = [
  createRoute({ name: 'home', path: '/' }),
] as const

const rejections = [
  createRejection({ type: 'RequiresAuth' }),
] as const

const plugin = createRouterPlugin({
  routes,
  rejections,
})
```

## Installing

Pass plugins as the third argument to `createRouter`. Their routes, rejections, and hooks become available on that router.

```ts
import { createRouter } from '@kitbag/router'

const router = createRouter([], {}, [plugin])
```

The first argument can contain your application's own routes, and the second contains the usual [router options](/core-concepts/router#router-options).

## Hooks

Plugins can also define global [Hooks](/advanced-concepts/hooks).

```ts
plugin.onBeforeRouteEnter(() => {
  console.log('before route enter')
})
```

<aside class="version-note" role="note">

**Version note:** Plugin hook options were deprecated in [0.20.11](/upgrading/0.20.11#plugin-hook-options) and removed in [0.21.0](/upgrading/0.21.0#hook-registration).

</aside>
