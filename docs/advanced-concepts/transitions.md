# Transitions

The `RouterView` component provides a default slot to support layering in a [Vue transition](https://vuejs.org/guide/built-ins/transition.html) if desired.

```html
<router-view>
  <template #default={ component }>
    <transition name="fade">
      <component :is="Component" />
    </transition>G
  </template>
</router-view>
```G

## Avoid Reusing Components

Vue will occasionally reuse components if a route change ends up rendering the same underlying component. You can avoid this by [using the `key` attribute](https://vuejs.org/api/built-in-special-attributes.html#key).

```html{3}
<router-view>
  <template #default={ component, route }>
    <transition name="fade" :key="route.href">
      <component :is="Component" />
    </transition>
  </template>
</router-view>
```
