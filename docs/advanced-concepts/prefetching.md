# Prefetching

Prefetching is a powerful feature in Kitbag Router that allows your application to start loading dependencies before users navigate, improving user experience by reducing the wait time when navigating.

## Prefetching Components

When your route component is defined using `defineAsyncComponent`, Kitbag Router can start fetching that component asynchronously before it is needed.

```ts
import { defineAsyncComponent } from 'vue'

const user = createRoute({
  name: 'user',
  path: '/user/[id]',
})
.addView(defineAsyncComponent(() => import('./UserPage.vue'))) // [!code focus]
```

## Prefetching Props

When your route uses the [props callback](/core-concepts/component-props), Kitbag Router can start fetching your component props before they are needed.

```ts {5-10}
const user = createRoute({
  name: 'user',
  path: '/user/[id]',
})
.addView(defineAsyncComponent(() => import('./UserPage.vue')), {
  props: async (route) => {
    const user = await userStore.getById(route.params.id)
    return { user }
  },
})
```

::: info
Props for routes and any parent routes are collected concurrently while components are being mounted. This avoids a waterfall from happening for async props.
:::

## How Prefetching Works

Prefetching is handled automatically when using the `router-link` component or the `useLink` composable based on the prefetch strategy determined for that specific link.

## Prefetch Strategies

The following prefetch strategies are supported:

- `eager` - Prefetch immediately when the link is rendered.
- `lazy` - Prefetch when the link is visible in the viewport.
- `intent` - Prefetch when the link is focused or hovered.

## Configuration

Prefetching can be configured at various levels. Each nested layer **overrides** the parent configuration.

- Global Configuration
- Per-Route Configuration
- Per-View Configuration
- Per-Link Configuration

This means that if prefetching is enabled globally, but disabled for a specific route, that route will not prefetch. Conversely, if prefetching is disabled globally, but enabled for a specific route, that route will prefetch.

Prefetching can be configured with a `boolean`, a `PrefetchStrategy`, or a `PrefetchConfigOptions` object.

::: code-group

```ts [boolean]
prefetch: true
```

```ts [PrefetchStrategy]
prefetch: 'lazy'
```

```ts [PrefetchConfigOptions]
prefetch: {
  components: 'eager',
  props: false,
}
```

:::

::: info
If the prefetch configuration is `true`, Kitbag Router will look at any overriden prefetch configs for a strategy. If no stragety is configured the default strategy `lazy` is used.
:::

### Global Configuration

By default, prefetching components is enabled and prefetching props is disabled. However, you can modify prefetching globally in your router instance by setting the `options.prefetch` property.

```ts
import { createRouter } from 'kitbag-router';

const router = createRouter({
  options: {
    prefetch: false, // all prefetching is disabled by default
  },
});
```

### Per-Route Configuration

If you want to enable or disable prefetching for specific routes, you can do so by adding a prefetch property to your route definition.

```ts
const about = createRoute({
  path: '/about',
  prefetch: true, // enable prefetching for this route
})
.addView(() => import('./About.vue'))

const contact = createRoute({
  path: '/contact',
  prefetch: false, // disable prefetching for this route
})
.addView(() => import('./Contact.vue'))
```

### Per-View Configuration

When a route has multiple views, each one can carry its own prefetch config by passing a `prefetch` option to [addView](/core-concepts/routes#prefetch). This is useful when only some views are worth prefetching.

```ts
const dashboard = createRoute({
  path: '/dashboard',
})
  .addView(defineAsyncComponent(() => import('./Dashboard.vue')))
  .addView(defineAsyncComponent(() => import('./Sidebar.vue')), {
    name: 'sidebar',
    prefetch: 'eager', // [!code focus]
  })
  .addView(defineAsyncComponent(() => import('./HeavyReport.vue')), {
    name: 'report',
    prefetch: false, // [!code focus]
  })
```

A single view can mix component and props strategies.

```ts
const user = createRoute({
  path: '/user/[id]',
})
.addView(defineAsyncComponent(() => import('./UserPage.vue')), {
  props: async (route) => {
    const user = await userStore.getById(route.params.id)
    return { user }
  },
  prefetch: { // [!code focus]
    components: 'eager', // [!code focus]
    props: 'intent', // [!code focus]
  }, // [!code focus]
})
```

Views without their own config fall back to the route's config.

::: warning
Props for a view can only reference parent props that were also prefetched. If a child view prefetches props but its parent view does not, the parent props will be unavailable during prefetching and a warning is logged.
:::

### Per-Link Configuration

You can also control prefetching at the level of individual router-links by passing a prefetch prop.

```html
<router-link to="/about" prefetch>About Us</router-link>
<router-link to="/about" prefetch="lazy">About Us</router-link>
<router-link to="/contact" :prefetch="false">Contact Us</router-link>
```

Similarly, when using the `useLink` composable, you can pass a prefetch option.

```ts
import { useLink } from 'kitbag-router';

const link = useLink({
  to: '/about',
  prefetch: true, // enable prefetching for this link
});
```
