# Prefetching

Prefetching is a powerful feature in the Kitbag Router that allows your application to load components in advance, improving user experience by reducing the wait time when navigating to a new route. 

::: info Async Components Only
Prefetching is only relevant to routes with components defined with `defineAsyncComponent`.
:::

## How Prefetching Works

Prefetching is triggered when a router-link is rendered or when the `useLink` composable is called. If the target route for the link is defined as an asynchronous component, Kitbag Router will automatically start loading the component as soon as the link is rendered or the composable is used. This ensures that when the user clicks on the link, the component is already loaded, leading to a faster navigation experience.

## Configuration Options

Prefetching can be configured at various levels. Each nested layer **overrides** the parent configuration.

- Global Configuration
- Per-Route Configuration
- Per-Link Configuration

This means that global is `true` but per-route is `false`. That route will NOT prefetch. If per-route is `false` but per-link is `true`, the route WILL prefetch.

### Global Configuration

By default, `prefetching` components is enabled. However, you can disable prefetching globally in your router instance by setting the `options.prefetch` property.

```ts
import { createRouter } from 'kitbag-router';

const router = createRouter({
  options: {
    prefetch: false, // Prefetching is disabled globally
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
    prefetch: true, // Enable prefetching for this route
  },
  {
    path: '/contact',
    component: () => import('./Contact.vue'),
    prefetch: false, // Disable prefetching for this route
  },
];
```

### Per-Link Configuration

You can also control prefetching at the level of individual router-link components by passing a prefetch prop.

```html
<router-link to="/about" prefetch>About Us</router-link>
<router-link to="/contact">Contact Us</router-link>
```

Similarly, when using the `useLink` composable, you can pass a prefetch option.

```ts
import { useLink } from 'kitbag-router';

const link = useLink({
  to: '/about',
  prefetch: true, // Enable prefetching for this link
});
```

## Prefetch Configuration Options

The prefetch option can take a value of `boolean | PrefetchConfigOptions`. Currently, `PrefetchConfigOptions` is an object with a single property:

```ts
type PrefetchConfigOptions = {
  component: boolean
}
```

The `PrefetchConfigOptions` object is designed to allow for future expansion. In upcoming releases, additional prefetch-related options may be added, providing even more control over how and when prefetching occurs in your application.
