# Prefetching

Prefetching is a powerful feature in Kitbag Router that allows your application to start loading dependencies before users navigate, improving user experience by reducing the wait time when navigating. 

## Prefetching the Component

When your route uses `defineAsyncComponent`, Kitbag Router can start loading that component file.

```ts
import { defineAsyncComponent } from 'vue'

const user = createRoute({
  name: 'user',
  path: '/user/[id]',
  component: defineAsyncComponent(() => import('./UserPage.vue')),
})
```

## Prefetching props

When your route uses the [props callback](/core-concepts/component-props), Kitbag Router can start fetching your component props.

```ts
const user = createRoute({
  name: 'user',
  path: '/user/[id]',
  component: defineAsyncComponent(() => import('./UserPage.vue')),
  props: async (({ id }) => {
    const user = await userStore.getById(id)
    return { user }
  })
})
```

## How Prefetching Works

Prefetching is triggered when a router-link is rendered or when the `useLink` composable is called. Route for the link is setup for prefetching and prefetching is enabled, Kitbag Router will automatically start loading as soon as the link is rendered or the composable is used. This ensures that when the user clicks on the link, the component and/or props are already loaded, leading to a faster navigation experience.

Props for routes and any parent routes are collected concurrently before components are mounted. This means that any async props are not blocking and avoids a waterfall from happening.

## Configuration Options

Prefetching can be configured at various levels. Each nested layer **overrides** the parent configuration.

- Global Configuration
- Per-Route Configuration
- Per-Link Configuration

This means that global is `true` but per-route is `false`. That route will NOT prefetch. If per-route is `false` but per-link is `true`, the route WILL prefetch.

### Global Configuration

By default, prefetching components is enabled and prefetching props is disabled. However, you can modify prefetching globally in your router instance by setting the `options.prefetch` property.

```ts
import { createRouter } from 'kitbag-router';

const router = createRouter({
  options: {
    prefetch: false, // all prefetching is disabled globally
  },
});
```

### Per-Route Configuration

If you want to enable or disable prefetching for specific routes, you can do so by adding a prefetch property to your route definition.

```ts
const routes = [
  {
    path: '/about',
    component: () => import('./About.vue'),
    prefetch: true, // enable prefetching for this route
  },
  {
    path: '/contact',
    component: () => import('./Contact.vue'),
    prefetch: false, // disable prefetching for this route
  },
];
```

### Per-Link Configuration

You can also control prefetching at the level of individual router-links by passing a prefetch prop.

```html
<router-link to="/about" prefetch>About Us</router-link>
<router-link to="/contact">Contact Us</router-link>
```

Similarly, when using the `useLink` composable, you can pass a prefetch option.

```ts
import { useLink } from 'kitbag-router';

const link = useLink({
  to: '/about',
  prefetch: true, // enable prefetching for this link
});
```

## Prefetch Configuration Options

Everywhere you can set `prefetch` you can use `boolean` to enable/disable for both `components` and `props`. Alternatively, you can use the `PrefetchConfigOptions` object syntax to configure prefetching separately.

```ts
type PrefetchConfigOptions = {
  component: boolean,
  props: boolean,
}
```
