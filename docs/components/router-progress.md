# RouterProgress

The router progress component renders a bar across the top of the page while a navigation is in progress. It is registered globally by the [router plugin](/quick-start#vue-plugin).

```vue
<template>
  <router-progress />
  <router-view />
</template>
```

The bar fills based on how much of the navigation's work has actually finished, not on a timer. See [navigation progress](/advanced-concepts/navigation-progress) for what gets counted.

## Props

| Prop | Required | Type | Default | Description |
| --- | --- | --- | --- | --- |
| delay | false | `number` | `150` | How long a navigation has to be in progress, in milliseconds, before the bar appears |
| color | false | `string` | `var(--router-progress-color, #29d)` | The color of the bar |
| label | false | `string` | `Loading page` | The accessible name of the bar, read out by screen readers |

## Behavior

- The bar only appears once a navigation has been in progress for `delay`, so quick navigations never flash one.
- While it waits on a slow unit of work, the bar keeps inching toward where that unit would take it, so a single slow hook does not look frozen. When the unit finishes, the bar jumps to the real progress.
- When the navigation reaches its route, the bar fills up and then fades out.
- When the navigation is rejected or aborted, the bar disappears without filling up.
- When another navigation starts while the bar is showing, the bar starts over for the new one.

## Styling

The bar is a fixed element at the top of the viewport. Its color comes from the `color` prop or the `--router-progress-color` custom property, and its height from `--router-progress-height`.

```css
:root {
  --router-progress-color: #10b981;
  --router-progress-height: 2px;
}
```

For anything else, target the `router-progress` and `router-progress__bar` classes.
