# RFC: Scroll behavior

Status: Proposed. This document describes new APIs; it does not document implemented behavior.

## Motivation

Navigation should handle ordinary scrolling without application configuration: start a new page at the top, follow an anchor, and restore the previous position when traversing history. Applications also need to preserve positions when changing filters or tabs, reset pagination, and manage layouts with independently scrolling content and sidebars.

Provide one `scroll` option across routers, routes, views, params, links, and individual `push` and `replace` calls. Resolve its policy separately for each scroll area. Export `RouterScroll` for element scrolling, alongside automatic document scrolling.

Restoration follows predictable navigation and rendering lifecycles. This proposal does not attempt to detect stable content, observe heights, retry scrolling, or infer whether the user has started scrolling.

## Default behavior

Document scrolling is enabled without configuration. Positions belong to history entries, so separate visits to the same URL retain independent positions.

| Navigation | Built-in behavior |
| --- | --- |
| Back or Forward with a saved position | Restore the destination entry's position, ahead of anchor behavior |
| Back or Forward without a saved position | Use the destination anchor, otherwise top |
| New pathname, including changed path params | Use the destination anchor, otherwise top |
| Changed hash with a matching target | Scroll to that target |
| Query-only or state-only change | Preserve the current position |
| Same URL without a hash | Preserve the current position |
| Repeated navigation to the same URL with a hash | Scroll to that target again |
| Replace | Use the same scroll rules as push |
| Aborted or superseded navigation | Do not apply its pending scroll |

An unchanged hash does not cause a query-only update to scroll back to the anchor. Removing a hash on the same page preserves the position. A missing anchor falls back to top for a new page and preserves position for a same-page hash update. Anchor lookup runs once at the applicable lifecycle milestone.

Initial loading and hydration must coordinate with the browser's existing position and anchor handling, without an unconditional top reset. An explicit policy can override normal behavior. New-navigation overrides are not stored as permanent instructions on history entries: a link using `preserve` does not disable later Back/Forward restoration.

## Shared scroll option

Every configuration level accepts the same behavior or callback:

```ts
type ScrollBehavior = 'default' | 'inherit' | 'preserve' | 'top' | 'bottom'

// ScrollContext carries the area-name union inferred from registration or context.
type ScrollConfig = ScrollBehavior | ((context: ScrollContext) => ScrollBehavior)
```

| Value | Meaning |
| --- | --- |
| `default` | Stop policy inheritance and use Kitbag's built-in behavior |
| `inherit` | Continue to the next applicable policy |
| `preserve` | Capture this area's position before navigation and restore it after the destination renders |
| `top` | Scroll to the vertical start, preserving the horizontal position and overriding anchor behavior |
| `bottom` | Scroll to the current vertical end, preserving the horizontal position and overriding anchor behavior |

An omitted option is equivalent to `inherit`. Callbacks return a named behavior, including `inherit`; `undefined` is not another public behavior. A preserved numeric position can still be clamped if the destination is shorter at the restoration milestone.

`preserve` actively restores the outgoing area's captured position at the normal scroll application milestone. Capture both axes, using a bottom marker when detected. This survives temporary scroll clamping while content is replaced or a loading fallback is visible. Do not recapture that temporary position before restoring. Built-in behavior described as preserving a position uses the same capture-and-restore semantics.

On ordinary navigation, preservation carries the outgoing area's position into the destination area with the same identity. On Back/Forward, the destination history entry's saved position takes precedence; do not substitute the outgoing page's position. Preservation is not an opt-out from scroll management.

Callbacks are synchronous policy decisions. Async readiness, arbitrary coordinates, and custom element targets are outside the initial shared option. This avoids ambiguous merging when multiple changed params supply policies.

### Navigation and link overrides

Pagination can reset scroll explicitly, and a URL update can preserve it. Named-route overloads continue to take options after params.

```ts
await router.push('/products?page=2', { scroll: 'top' })
await router.replace('/products?sort=price', { scroll: 'preserve' })
```

A chat or activity view can request its current bottom explicitly. `bottom` is available at every configuration level, including callback results.

```ts
await router.push('/chat/general', { scroll: 'bottom' })
```

Links expose the same option and pass it into navigation.

```vue
<RouterLink to="/products?page=2" scroll="top">
  Next page
</RouterLink>
```

### Router, route, and view policies

The router option supplies the application policy. Route policies, including child route policies, are navigation-wide fallbacks for the document and registered scroll areas. Resolve the destination route chain from the deepest match outward: an omitted option or `inherit` continues to the parent, while `default` stops inheritance and chooses built-in behavior. This route fallback is independent of which view contains an area.

View policies apply only to descendant `RouterScroll` areas through Vue's component context. They do not control document scrolling or a container surrounding the view. A view without a descendant `RouterScroll` has no area on which to apply its policy. View registration can override a reusable view's policy, following the existing view-option pattern.

| Configuration | Scope |
| --- | --- |
| Router | Application-wide fallback |
| Route, including child route | Navigation-wide fallback for document and element areas |
| View | Descendant `RouterScroll` areas |
| `RouterScroll` | Its own element |

For the following view policies to take effect, `ProductList` and `ProductSidebar` each render a `RouterScroll` around their scrolling content. Their policies override the route fallback for those areas; the document uses the route's `preserve` policy.

```ts
const products = createRoute({
  name: 'products',
  path: '/products',
  scroll: 'preserve',
})
  .addView(ProductList, { scroll: 'preserve' })
  .addView(ProductSidebar, {
    name: 'sidebar',
    scroll: 'top',
  })

const router = createRouter([products], { scroll: 'default' })
```

`createView` also accepts `scroll`, so reusable views can carry their policy. The components in the example provide their own areas:

```vue
<!-- ProductList.vue -->
<RouterScroll name="main">
  <ProductListContent />
</RouterScroll>
```

```vue
<!-- ProductSidebar.vue -->
<RouterScroll name="sidebar">
  <ProductSidebarContent />
</RouterScroll>
```

The document is managed automatically. Independently scrolling elements must be registered with `RouterScroll`; a route or view policy alone does not register an element for scrolling.

A child route's `scroll: 'top'` applies to the document and registered `RouterScroll` areas that inherit route behavior. An independently scrolling sidebar must use `RouterScroll`; setting `scroll: 'preserve'` on that component overrides the route policy. A view-level policy likewise requires a descendant `RouterScroll` to take effect.

### Param policies

Add `scroll` to object-form param definitions. Only params changed by the navigation contribute. A pagination param can reset scroll regardless of which link or call changes it, while a sorting param preserves scroll.

```ts
const products = createRoute({
  name: 'products',
  path: '/products',
  query: withParams('page=[?page]&sort=[?sort]', {
    page: {
      get: Number,
      set: String,
      scroll: 'top',
    },
    sort: {
      get: String,
      set: String,
      scroll: 'preserve',
    },
  }),
})
```

Param callbacks receive the shared scroll context plus the param name and previous/next parsed values. Param defaults must not replace a saved position during Back/Forward traversal. Equality for custom parsed values remains a review question below.

### Callbacks are evaluated per area

The callback accepts a single context object containing `to`, `from`, and `area`, plus navigation kind (`push`, `replace`, `traverse`, or `initial`), the area's saved position if present, and an abort signal. `area` is a name string, not a descriptor or definition object. Router-level and navigation callbacks infer its literal union from registered scroll-area definitions, including the built-in `document` area. Exact exported context types should retain Kitbag's route inference. Additional area metadata can be exposed separately if a concrete use case requires it.

A single navigation can reset the sidebar and preserve the main area without a separate target option:

```ts
await router.push('/products?page=2', {
  scroll: ({ area }) => {
    if (area === 'sidebar') {
      return 'top'
    }

    if (area === 'main') {
      return 'preserve'
    }

    return 'inherit'
  },
})
```

The same callback form works at every configuration level. Evaluate only callbacks needed by policy resolution. Callbacks should not rely on order or perform scrolling themselves. A link's physical location does not limit its scope: a sidebar link can navigate main content.

## Named scroll-area definitions and type safety

`createScrollArea` returns a `ScrollArea` definition that preserves its literal name. Define areas once and register them with the router, following Kitbag's named-definition pattern. These definitions describe available areas; they do not contain DOM elements or mutable scroll positions.

```ts
export const sidebar = createScrollArea({ name: 'sidebar' })
export const main = createScrollArea({ name: 'main' })
```

Register the definitions through `scrollAreas` when creating the router. The built-in `document` name is included automatically and needs no user definition.

```ts
const router = createRouter(routes, {
  scrollAreas: [sidebar, main],
})

await router.push('/products', {
  scroll: ({ area }) => {
    // area: 'document' | 'sidebar' | 'main'
    return area === 'sidebar' ? 'preserve' : 'top'
  },
})
```

Carry this name union through router-level policies, navigation options, links, and router-typed `RouterScroll` components. Use Kitbag's existing registered-router and `createRouterAssets` mechanisms to provide the router type to components. A typed component rejects an unregistered name; callbacks can compare `area` directly to a registered string literal without importing its definition.

```vue
<RouterScroll name="sidebar">
  <SidebarContent />
</RouterScroll>
```

Definition registration does not register a scrollable element. The corresponding `RouterScroll` must mount before that element can be captured or restored. A declared area can be absent because of conditional rendering or layout differences; the type guarantees a known name, not a mounted element. Keep runtime state scoped to the router instance and use stable names for persisted positions.

### Context for standalone definitions

Routes and reusable views or params may be defined before the router exists. Later router registration cannot retroactively infer those callbacks' contextual types. Extend applicable definition context to accept scroll-area definitions so local callbacks can declare the area names they need. The proposed route syntax is:

```ts
const products = createRoute({
  name: 'products',
  path: '/products',
  context: [sidebar, main],
  scroll: ({ area }) => area === 'sidebar' ? 'preserve' : 'inherit',
})
```

The exact relationship between local context, runtime applicability, and router discovery remains open. If a callback declares only `sidebar` but is invoked for other mounted areas, typing its input as only `'sidebar'` would be incorrect. Before implementation, choose whether local context scopes callback applicability (other areas inherit), whether unknown areas remain representable in its input type, or another sound mechanism. Do not silently narrow the input while still invoking it with undeclared names. Document how the built-in document area participates as well.

Also settle whether context discovery registers definitions automatically and how discovered names contribute to the router's public union. Do not require duplicate declarations without a clear purpose. The extension needed for standalone param definitions, which do not currently have their own context option, requires a concrete typing design. None of these declarations changes the established route/view/container policy scopes.

## RouterScroll

The document is registered automatically. `RouterScroll` registers an element as an additional independent scroll area, renders its scroll container, and accepts `name` and `scroll`. CSS controls overflow and dimensions. The default rendered element is proposed to be a `div`; polymorphic rendering can be considered separately.

```vue
<RouterScroll name="main" class="main">
  <RouterView />
</RouterScroll>

<RouterScroll name="sidebar" scroll="preserve" class="sidebar">
  <RouterView name="sidebar" />
</RouterScroll>
```

One history entry can store positions for the document, main, sidebar, and further nested `RouterScroll` elements. Each component owns only its own element; restoring a parent does not recursively reset child areas. Ordinary policy inheritance is separate from DOM nesting.

Use a registered stable name unique within a router instance, reserving `document` for its automatic area. Conflicting definitions with the same name and duplicate active elements should produce development diagnostics rather than silently overwrite positions. Names allow restoration after an element unmounts and remounts. Remove mounted-element registrations on unmount while retaining the definition and saved history positions. Scope state to the router instance.

`RouterView` provides its view's policy context to descendants. A `RouterScroll` uses its nearest enclosing routed view's policy when its own option inherits, then falls back to the destination route chain. Nested routed views establish their own view context; their omitted view policy falls back to route policy rather than searching ancestor view policies.

A `RouterScroll` surrounding one or more `RouterView` components does not adopt their policies. Configure that surrounding container directly, as in the layout example above, or let it use its enclosing view context and route fallback. The router does not inspect child views to infer ownership. This rule also applies when the container surrounds multiple named views.

Saved positions include both axes, with a bottom marker replacing the vertical offset when captured at the end. Element restoration uses that element's own scroll range. Anchor scrolling must avoid moving unrelated registered areas and should respect CSS scroll margins/padding. A sidebar's ordinary `preserve` policy still allows its saved position to restore on history traversal.

## Policy resolution

Resolve separately for each area. The following precedence is proposed for review, rather than an existing API contract:

1. Explicit navigation option, including a link's option.
2. Changed-param policies.
3. The area's `RouterScroll` policy.
4. Its nearest enclosing routed view's policy, with registration overriding reusable-view defaults. Skip this level for the document or an area outside a routed view.
5. The destination route policy, walking from the deepest matched route outward through parents, regardless of the area's enclosing view.
6. Router policy.
7. Built-in behavior.

`inherit` advances through this chain; `default` stops and selects built-in behavior. For simultaneous changed params, the proposed deterministic combination is `top`, then `bottom`, then `preserve`, then `default`; all `inherit` results fall through. This detail needs review, especially for conflicting `top` and `bottom` requests or explicit `default` mixed with another param's override.

On history traversal, restore a saved area position before applying ordinary param, container, view, route, or router defaults. This preserves history semantics even when the destination page normally resets on pagination. A future explicit traversal override, if added, would be separate from a policy remembered from the original push.

All registered destination areas are considered so a navigation callback can explicitly control an otherwise unchanged sidebar. Built-in behavior preserves unchanged view-owned areas on ordinary navigation. Explicit policies can override that result. Document behavior follows the default table. Deciding whether a reused view participates in a meaningful update remains a review question below.

## Saving and restoring the bottom

Automatically detect the bottom for both the document and registered `RouterScroll` areas when capturing positions. No opt-in is required. Save a vertical `bottom` marker when the area overflows vertically and its offset is within a small rounding tolerance of the maximum scroll offset. The proposed tolerance is one CSS pixel. Normalize browser overscroll before comparing; reverse-flow layouts need equivalent normalization rather than assuming every browser offset is nonnegative.

If the area does not overflow vertically, save numeric zero. Such an area is simultaneously at its top and bottom, and must not jump to the bottom if its content is longer on return. Otherwise, save the numeric vertical offset when away from the bottom. Always save the horizontal offset independently.

At restoration, resolve a bottom marker against the area's current maximum vertical offset and restore its saved horizontal offset. Numeric positions continue to restore their saved coordinates. The callback context's saved position must preserve the distinction between numeric offsets and bottom markers.

For example, leaving a chat at its bottom and returning after more messages have loaded restores to the new bottom. Leaving halfway through restores the previous numeric position. This deliberately remembers being at the end rather than the old end's pixel offset. A destination that no longer overflows restores its bottom marker to zero.

Both an explicit `bottom` policy and a saved bottom marker apply once at the normal restoration milestone. They do not keep a view pinned as messages arrive afterward. Measuring the scroll range at capture and application does not introduce height observation, readiness checks, or retries. `start` and `end` are outside this proposal.

## Capture and restoration lifecycle

Capture outgoing positions before replacing their rendered content. Associate those positions with the outgoing rendered history entry, not whatever entry the browser currently exposes: during `popstate`, browser history already points at the destination. Do not overwrite the outgoing entry with positions from a destination fallback.

| Navigation mode | Scroll application milestone |
| --- | --- |
| Blocking | After tracked loaders, props, and route components finish, the destination commits, and Vue flushes its DOM update |
| Progressive | After the current navigation's tracked work settles and Vue flushes the resulting DOM update |
| Browser View Transition | Inside the transition update callback after the destination DOM update, before the destination snapshot |

Progressive navigation may display fallbacks while work is pending. Its scroll operation waits for tracked work; it does not force the route itself to commit in blocking mode. Use navigation-specific completion, not global application idleness. Cached or synchronous work follows the same ordering.

Apply each area's resolved policy once. Check the navigation's abort signal after every wait and before writing positions. Redirects and superseding navigations discard the old scroll operation. Failed navigations that leave the current view in place do not scroll it. A committed rejection/error view needs an explicit completion path; waiting for progress that was aborted must not leave an operation hanging.

No ResizeObserver, MutationObserver, height threshold, layout quiet period, timeout retry, or user-intent detection participates in restoration. If a saved numeric position exceeds the final scroll range at the milestone, let the browser clamp it. Do not retry when the page later grows. Positions restore instantly rather than animating from the outgoing page's offset.

This milestone covers router-tracked work, not arbitrary async setup, independently fetched content, images, or CSS transitions. Applications should reserve image dimensions and use loaders/props for content needed by restoration. A public manual/readiness API is deferred until concrete use cases justify it; none is required by this RFC.

## Browser lifecycle and compatibility

Coordinate automatic browser restoration with Kitbag so two owners do not write competing positions. Scope any `history.scrollRestoration` ownership to the active document router and clean it up when that router is disposed. SSR must not read or write browser globals. Memory routers must not implicitly take ownership of the document.

Persist bounded, namespaced position data by history-entry and area identity if supporting reload restoration; unavailable storage must not break navigation. Initial hydration, reload, and back-forward-cache resume require dedicated handling and browser tests. The precise persistence mechanism and document-owner arbitration remain implementation details to settle before shipping.

This is a behavior change: applications currently preserving scroll incidentally on new-page navigation will begin resetting. A router-level `scroll: 'preserve'` captures and restores outgoing positions on ordinary navigation while retaining destination-entry restoration on history traversal. A complete opt-out from Kitbag's scroll management is a separate release decision, not another meaning of `preserve`.

## Validation for implementation

Type checks should establish literal-name inference, rejection of unknown component names, the built-in document name, propagation through navigation/link options and router assets, and sound local-context typing once its applicability rules are chosen.

Browser coverage should establish:

- Independent positions for repeated visits to one URL and for document/main/sidebar areas.
- Back/Forward restoration taking precedence over pagination and anchors.
- Automatic bottom capture for document and element areas, rounding tolerance, overscroll normalization, and non-overflowing areas saving zero.
- Bottom markers restoring against a changed scroll range while restoring the saved horizontal offset; numeric offsets remaining numeric away from the bottom.
- Explicit `top` and `bottom` preserving the current horizontal position, and bottom restoration running only once despite later content growth.
- Query, state, hash, repeated-anchor, push, and replace behavior.
- Every policy level, explicit `default` versus `inherit`, per-area callbacks, and simultaneous param changes.
- Nested areas, unmount/remount, duplicate names, and multiple named views.
- View policies reaching descendant areas only, with no effect on document scrolling or surrounding containers.
- Child route policies applying as navigation-wide fallbacks, including document scrolling, while explicit area/view policies retain their scope.
- Blocking and progressive rendering with delayed loaders, props, and lazy components.
- A superseding navigation during each asynchronous phase and an aborted history traversal.
- Redirects, rejection views, and loader/props failures without stale or indefinitely pending scroll work.
- View Transition snapshots containing the intended destination position.
- Preservation restoring the outgoing position after a temporary fallback clamps scrolling, including both axes and detected bottom markers.
- History traversal restoring the destination entry rather than the outgoing position even when its ordinary policy is `preserve`.
- A too-short destination clamping once, with no later retry or observer-driven jump.
- Hydration, reload, back-forward cache, storage failure, SSR, and multiple router instances.

## Questions for review

The shared values, per-area callbacks, multiple independent areas, and lifecycle-only timing are the core proposal. Resolve these details before implementation:

1. When does a reused view count as updated for its built-in policy?
2. Is the proposed precedence correct, particularly changed params versus container/view policies? Is `top > bottom > preserve > default` the right reduction for multiple changed params?
3. How are changed params compared when getters return objects, dates, or arrays? Reference equality alone would make reparsing appear to change values.
4. How does local scroll-area context constrain callback applicability without excluding runtime values from its declared type? How should context discovery affect router registration and its public name union, including standalone params?
5. What full opt-out should applications with an existing scroll manager use, and should it be part of the initial release?
6. Which persisted positions should initial hydration adopt, and how should multiple browser routers arbitrate document ownership?

## Related approaches

- [Vue Router's traditional scrollBehavior](https://router.vuejs.org/guide/advanced/scroll-behavior.html) lets applications return coordinates, elements, or a promise.
- [Vue Router's experimental restoration](https://router.vuejs.org/experimental/scroll-restoration.html) ties restoration to route rendering and offers manual restoration for content outside that lifecycle.
- [TanStack Router](https://tanstack.com/router/latest/docs/guide/scroll-restoration) supports history-entry keys, multiple areas, and virtualizer integration.
- [React Router](https://reactrouter.com/api/components/ScrollRestoration) exposes history-entry restoration and custom keys; [link overrides](https://reactrouter.com/api/components/Link#preventscrollreset) preserve ordinary navigation without disabling later traversal restoration.
- [SvelteKit](https://svelte.dev/docs/kit/link-options) provides automatic top/anchor behavior and navigation-level preservation.

Kitbag adopts rendering milestones rather than a general claim that page layout has stabilized. Geometry observation would be a different restoration strategy and is excluded from this proposal.
