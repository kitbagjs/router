# Scroll Restoration

Opt in to let the browser restore the viewport after Back or Forward once the destination's routed views have rendered:

```ts
const router = createRouter(routes, {
  scrollRestoration: true,
})
```

The browser owns the saved positions, including separate entries with identical URLs. Kitbag does not record coordinates or change `history.scrollRestoration`. Successful history traversals adopt the selected entry without rewriting it.

## Rendering and cancellation

For eligible same-document traversals, Kitbag prepares all destination route props, loaders and lazy component modules in a staged store. Every loader participates, including loaders no props getter reads. The outgoing page stays mounted until preparation finishes. The router then uses its existing commit and error handling, runs after hooks and waits for Vue to flush the update. Loading uses `Promise.allSettled`: failed data can still commit a rejection or partial destination as it does with view transitions alone. Such outcomes reject native restoration rather than restoring against that view.

At that boundary, Kitbag calls `NavigateEvent.scroll()` once to let the browser apply the selected entry's saved position. With view transitions enabled, this happens inside the transition update callback, before the browser captures the new view. It does not wait for the animation to finish. With the option off, ordinary navigation behavior is unchanged.

A newer navigation, router stop, application unmount, redirect, rejection or failed loading abandons pending native restoration. This releases the interception handler even if application work ignores cancellation; it does not change the existing staged-store lifecycle or make every router loading promise cancelable. `RouterView`, component reuse and props wrappers need no scroll-specific protocol.

Component `async setup()`, application Suspense branches, custom slots that defer or replace route rendering, images, virtualized content and later layout changes are outside this boundary. They are not detected or tracked. Put layout-critical data in route props or loaders and reserve space for later content; do not rely on this option for application-controlled asynchronous layout.

## Guards and browser support

This feature coordinates restoration **after the browser has committed the traversal**. It does not add a precommit guard mechanism. If a before hook aborts Back or Forward, Kitbag keeps the previous view and rejects the restoration handler, but the URL already points to the selected history entry. A rejected interception handler does not roll back that URL. Applications that need URL-preserving traversal vetoes should leave this option off until that separate routing behavior is supported; existing POP guards have the same URL limitation without interception.

`canIntercept` and `cancelable` have different meanings. Some traversals can be intercepted but cannot be canceled, and support for `intercept()` does not establish support for `precommitHandler`. Kitbag does not use `precommitHandler`. See the [Navigation API specification](https://html.spec.whatwg.org/dev/nav-history-apis.html#the-navigateevent-interface).

The option defaults to `false`. It only attaches to the first started global router using `auto`/`browser` history, in a browser with Navigation API interception and `NavigateEvent.scroll()`, while native restoration is `auto`. It does nothing for server rendering, memory history, hash history, non-global routers, cross-document navigation, non-interceptable traversals, or browsers without the API. Stopping the owner releases its listener. Another integration that intercepts the same navigation or changes native restoration to `manual` must coordinate ownership with the application. It provides no coordinate-based fallback.

It does not change scrolling for new pushes, replacements, fragments, initial loads, reloads, or BFCache restores. Nested scroll containers are not included. Interception uses `focusReset: 'manual'` so it does not add a new focus reset policy.

The browser fixture in `tests/navigation-readiness` verifies real viewport behavior. Chromium has been exercised locally; Firefox and Safari behavior still need browser verification. API availability alone is not a guarantee against browser restoration bugs.
