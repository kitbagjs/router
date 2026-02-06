# RouterView

The router view component is how route components are rendered. It is registered globally by the [router plugin](/quick-start#vue-plugin).

## Props

| Prop | Required | Type | Default | Description |
| --- | --- | --- | --- | --- |
| name | false | `string` | `default` | The name of component to render |

### The `name` prop

The `name` prop is used to specify the name of the component to render. Multiple components can be defined for a single route by using the `components` option.

## Slots

`RouterView` provides a default slot to render the route component. It receives the following slot scopes.

| Property | Type | Description |
| --- | --- | --- |
| route | [`ResolvedRoute`](/api/types/ResolvedRoute) | The resolved route object for the current route |
| component | `Component` | The component to render |
| rejection | `RouterRejection` | The rejection object for the current route |

## Transitions

The default slot can be used to layer in a [Vue transition](https://vuejs.org/guide/built-ins/transition.html) if desired.

```html
<router-view>
  <template #default="{ component }">
    <transition name="fade">
      <component :is="component" />
    </transition>
  </template>
</router-view>
```

## Component Reuse

Vue will reuse components if a route change ends up rendering the same underlying component. This has advantages but can simetimes cause issues. You can avoid this by [using the `key` attribute](https://vuejs.org/api/built-in-special-attributes.html#key). Using the `route.href` property is a good way to generate a unique key for each route.

```html{3}
<router-view>
  <template #default="{ component, route }">
    <transition name="fade" :key="route.href">
      <component :is="component" />
    </transition>
  </template>
</router-view>
```
