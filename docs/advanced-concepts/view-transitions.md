# View Transitions

Kitbag Router can animate navigations with the browser's [View Transitions API](https://developer.mozilla.org/en-US/docs/Web/API/View_Transition_API). The browser captures the page before the route changes and after, then animates between the two. By default the animation is a cross fade, and css decides everything else.

View transitions are off by default. Turn them on for the whole router, for a route, or for a single navigation.

::: warning Vue transitions

Avoid overlapping entering and leaving elements with the same `view-transition-name` when combining view transitions with Vue's [`<Transition>`](/components/router-view#transitions). Duplicate names cause the browser to skip the view transition. The browser captures the DOM as it appears at each snapshot, including any overlapping Vue transition content.

:::

## Configuration

Each level **overrides** the one before it for whether a navigation transitions.

- Router
- Route
- Navigation, through `router.push`, `router.replace`, [`RouterLink`](/components/router-link) or [`useLink`](/composables/useLink)

The option is a `boolean`, an array of [types](#types), or a [ViewTransitionConfigOptions](/api/types/ViewTransitionConfigOptions) object. An array or an object turns the transition on.

::: code-group

```ts [Router]
const router = createRouter(routes, {
  viewTransition: true,
})
```

```ts [Route]
const settings = createRoute({
  name: 'settings',
  path: '/settings',
  viewTransition: false,
})
```

```ts [Navigation]
router.push('profile', { userId: 123 }, { viewTransition: true })
```

```html [RouterLink]
<router-link :to="(resolve) => resolve('profile', { userId: 123 })" view-transition>
  Profile
</router-link>
```

:::

A route's option applies to navigations **to** that route, and a child route inherits its parent's option unless it sets its own.

## Types

Types tell css which kind of navigation is happening, so the same app can slide one way for forward navigations and the other way for back. Every level that is on contributes its types, so a router wide type and a link's direction both apply.

```ts
const router = createRouter(routes, {
  viewTransition: ['app'],
})

router.push('photo', { id: 2 }, { viewTransition: ['slide-left'] })
// the transition has the types "app" and "slide-left"
```

```css
html:active-view-transition-type(slide-left) {
  &::view-transition-old(root) {
    animation: slide-out-left 200ms ease-in;
  }

  &::view-transition-new(root) {
    animation: slide-in-right 200ms ease-out;
  }
}
```

Types can also be a callback, given the `to` and `from` routes of the navigation. Returning `false` skips the transition for that navigation.

```ts
const router = createRouter(routes, {
  viewTransition: {
    types: ({ to, from }) => {
      if (to.matched.id === from.matched.id) {
        return false // a param or query change on the same route does not animate
      }

      return to.matches.length > from.matches.length ? ['deeper'] : ['shallower']
    },
  },
})
```

Types are only passed to browsers that understand them. Older browsers still transition, without them.

## Shared Elements

Use [`ViewTransition`](/components/view-transition) to name the element shared by the outgoing and incoming pages. Inside `RouterLink`, it applies the name only while transitioning to that link's destination.

```html
<RouterLink
  v-for="photo in photos"
  :key="photo.id"
  :to="(resolve) => resolve('photo', { id: photo.id })"
>
  <ViewTransition name="photo" as="img" :src="photo.thumb" />
</RouterLink>
```

Outside a link, the element always carries its name. The destination can use the same component:

```html
<ViewTransition name="photo" as="img" :src="photo.full" />
```

Each captured page must contain at most one element with a given name. If multiple links point to the same destination, they share the transitioning state, so give their elements different names or name only one of them.

You can also bind `view-transition-name` yourself using `isTransitioning` from [`RouterLink`](/components/router-link#slot) or [`useLink`](/composables/useLink).

## The Transition in Flight

[`useViewTransition`](/composables/useViewTransition) returns reactive state describing the transition in flight. It knows the navigation from the moment the transition is decided, while the page being left is still live, so any component can prepare for a navigation it did not start. Once the browser has been asked to transition, it also carries the [`ViewTransition`](https://developer.mozilla.org/en-US/docs/Web/API/ViewTransition) itself.

| Property | Description |
| --- | --- |
| isTransitioning | True from when a navigation is decided to transition until its animation finishes |
| to | The route being navigated to |
| from | The route being left |
| types | The [types](#types) the transition runs with |
| transition | The browser's `ViewTransition`, once started |

The component being navigated to mounts inside the transition, before the animation starts, so awaiting `ready` or `finished` from `onMounted` lands at the right moment.

```ts
const viewTransition = useViewTransition()

onMounted(async () => {
  await viewTransition.transition?.finished

  heading.value?.focus()
})
```

## Custom Animations

Everything about the animation can live in css. Target the pseudo elements the browser creates to change timing or keyframes, and branch on [types](#types) for different navigations. See [Chrome's guide](https://developer.chrome.com/docs/web-platform/view-transitions/same-document) for what css can do.

For animations css cannot express, await `ready` on the [transition in flight](#the-transition-in-flight) and drive it with the Web Animations API.

```ts
const viewTransition = useViewTransition()

onMounted(async () => {
  const { transition, types } = viewTransition

  if (!transition || !types.includes('reveal')) {
    return
  }

  await transition.ready

  document.documentElement.animate(
    { clipPath: ['circle(0% at 50% 50%)', 'circle(150% at 50% 50%)'] },
    { duration: 400, pseudoElement: '::view-transition-new(root)' },
  )
})
```

To respect users who prefer less motion, turn the animation off in css.

```css
@media (prefers-reduced-motion: reduce) {
  ::view-transition-group(*),
  ::view-transition-old(*),
  ::view-transition-new(*) {
    animation: none !important;
  }
}
```

## Async Data

A navigation that transitions loads everything the destination renders with before the transition starts: the route's [props](/core-concepts/component-props), its loaders and any [async components](/advanced-concepts/prefetching#prefetching-components). The previous page stays on screen and interactive while that happens, and the browser then captures the destination with its content rather than a placeholder. Navigations that do not transition update the route immediately.

## What Does Not Transition

- The first navigation, since there is no page to animate from.
- Navigations on the server.
- Navigations in a browser without `document.startViewTransition`. These navigate exactly as they do with the option off.
- Navigations to external URLs.
- Navigations to an unmatched internal URL, which currently display NotFound without a view transition.
