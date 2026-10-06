# ViewTransition

`ViewTransition` names a shared element for the browser's [view transitions](/advanced-concepts/view-transitions). It is registered when the router is installed, and can also be imported from `@kitbag/router` or obtained from `createRouterAssets`.

```html
<ViewTransition name="photo" as="img" :src="photo.full" />
```

## Props

| Prop | Description |
| --- | --- |
| name | The `view-transition-name` shared by the outgoing and incoming elements. Required. |
| as | The HTML element to render. Defaults to `span`. |

Attributes, styles and default slot content are passed to the rendered element. Attribute types follow `as`: images accept `src` and `alt`, links accept `href`, and omitting `as` uses span attributes.

## Inside RouterLink

The component applies its name only while a transition to the enclosing link's destination is in flight. At other times its name is `none`. Outside a link, it always applies the supplied name.

```html
<RouterLink :to="(resolve) => resolve('photo', { id: photo.id })">
  <ViewTransition name="photo" as="img" :src="photo.thumb" />
</RouterLink>
```

The destination can use `ViewTransition` with the same name. Each page captured by the browser must have at most one element with that name, including when several links point to the same destination.
