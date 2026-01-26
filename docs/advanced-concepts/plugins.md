# Plugins

Plugins are a way to extend the router with additional functionality. They are used to add routes and rejections to the router.

```ts
import { createRouterPlugin } from '@kitbag/router'

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

## Hooks

Plugins can also define global [Hooks](/advanced-concepts/hooks).

```ts
plugin.onBeforeRouteEnter(() => {
  console.log('before route enter')
})
```
