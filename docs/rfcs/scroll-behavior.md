# RFC: Scroll behavior

Status: Proposed. These APIs are not implemented yet.

Handle ordinary scrolling automatically, with a shared `scroll` option for routers, routes, views, params, links, and navigation calls. Use `RouterScroll` when content scrolls inside an element instead of the document.

## Defaults

- New pages scroll to the top, or to their hash target.
- Back/Forward restores each area's position for that history entry, ahead of anchor behavior.
- Query-only and state-only updates preserve the current position. An unchanged hash does not trigger anchor scrolling again.
- Same-URL navigation preserves position, except repeated anchor links scroll to their target again.
- `replace` follows the same rules as `push`.

Initial loading and hydration respect browser restoration. If an anchor is missing, a new page falls back to top; a same-page hash change preserves position.

## Scroll options

Every level accepts one of these values or a callback returning one:

| Value | Behavior |
| --- | --- |
| `default` | Use Kitbag's built-in behavior instead of inherited options |
| `inherit` | Use the next applicable option; also the behavior when omitted |
| `preserve` | Capture the area's position before navigation and restore it after rendering |
| `top` | Scroll to the top, keeping the horizontal position |
| `bottom` | Scroll to the current bottom, keeping the horizontal position |

Preservation restores both axes, even if a loading fallback temporarily moves the scroll position. When captured at the bottom of an overflowing area, save “bottom” instead of a vertical offset. Returning then restores to the current bottom, including newly loaded content. An area without vertical overflow saves zero. This is automatic for the document and element areas.

Back/Forward uses the destination entry's saved position, not the position carried over from the outgoing page. Bottom restoration runs once; it does not keep content pinned as more items arrive.

## Named scroll areas

Define areas and register them with the router. Their names become the allowed values for callbacks and router-typed `RouterScroll` components. The document is always available as `'document'`.

```ts
const main = createScrollArea({ name: 'main' })
const sidebar = createScrollArea({ name: 'sidebar' })

const router = createRouter(routes, {
  scrollAreas: [main, sidebar],
  defaultScrollArea: 'main',
})
```

Registration declares a name. `RouterScroll` attaches that name to an actual scrollable element; CSS controls its size and overflow. Names must be unique within the router, including nested areas.

```vue
<RouterScroll name="main" class="main">
  <RouterView />
</RouterScroll>

<RouterScroll name="sidebar" class="sidebar">
  <RouterView name="sidebar" />
</RouterScroll>
```

The document and each mounted area save independent positions. Registering an area does not guarantee that its component is mounted.

## Links and navigation calls

A single behavior applies to `defaultScrollArea`, which defaults to `'document'`. Other areas use their inherited options. With the configuration above, these overrides affect only `main`:

```ts
await router.push('/products?page=2', { scroll: 'top' })
await router.replace('/products?sort=price', { scroll: 'preserve' })
```

```vue
<RouterLink to="/products?page=2" scroll="top">
  Next page
</RouterLink>
```

A callback runs separately for each area. Its single context object includes `to`, `from`, and `area`, plus navigation kind, saved position, and an abort signal. `area` is an inferred name string:

```ts
await router.push('/products?page=2', {
  scroll: ({ area }) => {
    // area: 'document' | 'main' | 'sidebar'
    return area === 'sidebar' ? 'top' : 'preserve'
  },
})
```

Thus `scroll: 'top'` affects the default area, while `scroll: () => 'top'` affects every area. Return `inherit` for areas that should follow their own options. A link's physical location does not change its scope.

If an explicit single-value override other than `inherit` needs the default area and it is not mounted when scrolling runs, skip that override and warn in development, naming the area and `defaultScrollArea` setting. Do not fall back to the document. Other areas still follow their policies. An absent registered area alone does not warrant a warning.

## Views and routes

**A view's option applies to its nearest enclosing `RouterScroll`, or to the document if there is none.** Different routes can give the same sidebar different behavior.

```ts
const products = createRoute({
  name: 'products',
  path: '/products',
  scroll: 'default',
})
  .addView(ProductList, { scroll: 'top' })
  .addView(ProductSidebar, {
    name: 'sidebar',
    scroll: 'preserve',
  })
```

In the layout above, the default view resets `main` and the sidebar view preserves `sidebar`. If the default view is outside a `RouterScroll`, it resets the document instead. `defaultScrollArea` only selects the target of single-value navigation overrides; it does not change view ownership.

Reusable `createView` definitions also accept `scroll`, with `.addView()` options taking precedence. A `RouterScroll` can set its own `scroll` option to override its views.

Route options, including child routes, are navigation-wide fallbacks. The deepest matched route with an option wins; `inherit` continues through parent routes. To affect one area instead, use a view option or an area-aware callback.

## Params

Changed params can provide scroll behavior, so pagination can reset while sorting preserves. Object-form param definitions accept the same values and callbacks:

```ts
const products = createRoute({
  name: 'products',
  path: '/products',
  query: withParams('page=[?page]', {
    page: {
      get: Number,
      set: String,
      scroll: 'top',
    },
  }),
})
```

Param callbacks also receive the param name and previous/next values. Saved history positions take precedence over ordinary param behavior.

## Inheritance and typing

Proposed order for each area: navigation override → changed params → `RouterScroll` → view → route and its parents → router → built-in behavior. A single-value navigation override is considered only for the default area; a callback is considered for every area. `inherit` advances through this order; `default` selects built-in behavior immediately.

Standalone routes and reusable definitions cannot infer names from a router created later. Allow scroll-area definitions in their context, for example `context: [main, sidebar]`. The exact typing and discovery rules remain open: a callback must not be typed to accept only locally declared names while being called with other names at runtime.

## When scrolling happens

| Navigation | Apply scroll once |
| --- | --- |
| Blocking | After the destination commits and Vue updates the DOM |
| Progressive | After tracked navigation work settles and Vue updates the DOM |
| View Transition | Inside the update callback, before the destination snapshot |

Capture positions before replacing content. Cancel pending scroll work when navigation is aborted or superseded. If the destination is too short, let the browser clamp the position. There is no height tracking, stability detection, or retry. Independently fetched content and later image/layout changes remain application concerns.

## Open questions

- Which view wins when multiple views share one area? Nested views could prefer the deepest view; sibling conflicts need a clear rule.
- Is the proposed precedence right? How should simultaneous changed params with conflicting behaviors combine?
- How should area context affect callback scope, automatic registration, and inferred names, including reusable params? How should custom parsed param values be compared?
- What full opt-out should apps with an existing scroll manager use? `preserve` actively restores positions and is not an opt-out.
- How should reload persistence and multiple routers sharing the document be handled?
