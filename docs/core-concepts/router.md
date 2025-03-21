# Router

The router is responsible for matching routes to urls and updating the browser history. It also provides a way to navigate to routes, access the current route, and provides some routing utilities. See [Router](/api/types/Router.md) type for more information.

## Creating a Router

Create a router using the `createRouter` utility.

```ts {8}
import { createRoute, createRouter } from '@kitbag/router'

const routes = [
  createRoute(...),
  createRoute(...),
] as const

const router = createRouter(routes)
```

## Installing

Once you have created a router you can install it into a Vue application using the `use` method.

```ts {8}
import { createRouter } from '@kitbag/router'
import { createApp } from 'vue'
import App from './App.vue'

const router = createRouter(...)
const app = createApp(App)

app.use(router)
app.mount('#app')
```

## Type Safety

Kitbag Router utilizes [declaration merging](https://www.typescriptlang.org/docs/handbook/declaration-merging.html) to provide the internal types to match the actual router you're using.

```ts
declare module '@kitbag/router' {
  interface Register {
    router: typeof router
  }
}
```

## Router Options

There are several options you can pass to the router to customize its behavior. See the [RouterOptions](/api/types/RouterOptions.md) type for more information and a list of options.

```ts
const router = createRouter(routes, {
  base: '/app',
})
```

## Router Instance

The router created by `createRouter` can be used directly in your application. You can also access the router instance using the [useRouter](/composables/useRouter.md) composable within your components.

```ts
import { useRouter } from '@kitbag/router'

const router = useRouter()
```

## Router Methods

### Push

Navigates to a specific route and adds a new history entry. Push accepts a route name, a resolved route, or a url. When using a route name, params can be passed as the second argument. The last argument is always the push options. See [RouterPushOptions](/api/types/RouterPushOptions.md) for more information.

```ts
router.push('blogPost', { blogPostId: 1 }, {
  query: {
    highlight: 'search term',
  },
})
```

### Replace

Replaces is exactly the same as push except it hard codes the `replace` option to `true`. See [Push vs Replace](/core-concepts/navigation#push-vs-replace) for more information.

```ts
router.replace('home')
```

### Refresh

Forces the router to re-evaluate the current route.

```ts
router.refresh()
```

### Back

Navigates to the previous history entry.

```ts
router.back()
```

### Forward

Navigates to the next history entry.

```ts
router.forward()
```

### Go

Moves the current history entry to a specific point in the history stack.

```ts
router.go(1)
```

### Reject

Handles route rejection based on a specified rejection type. See [Rejections](/advanced-concepts/rejections) for more information.

```ts
router.reject('NotFound')
```

### Find

Creates a URL for a given route and params.

```ts
router.find('users', { id: 1 })
```

### Resolve

Creates a ResolvedRoute record for a given route.

A [ResolvedRoute](/api/types/ResolvedRoute) is the base of what makes up the [Router Route](/core-concepts/router-route). It represents a [route](/core-concepts/routes) that has been matched to a specific location. It includes any params, state, query, and hash values for that location. Resolved routes are how Kitbag Router ensures type safety when navigating.

```ts
router.resolve('users', { id: 1 })
```

### IsExternal

Checks if a given URL is external to the router instance.

```ts
router.isExternal('https://google.com')
```

### Install

Installs the router into a Vue application instance.

```ts
router.install(app)
```

### Start

Initializes the router based on the initial route. Automatically called when the router is installed. Calling this more than once has no effect.

```ts
router.start()
```
