# Server Side Rendering

In order to fully render a page on the server, it needs to know when the page is ready and what to
respond with. [render](/core-concepts/router#render) waits for the route and all of its props and loaders to
settle, then returns everything the server needs to respond.

## Rendering a request

Create the per-request router with the `ssr` option — it marks every navigation as part of the server
render, and `render` throws without it. `render` resolves with a
[`ServerRenderResponse`](/api/types/ServerRenderResponse): the status to respond with, the `title` of
the route or rejection that rendered, and a `payload` — a script tag containing the values every props
getter and loader returned, which is what lets the client hydrate instead of computing everything
again. Embed the title and payload in the html the server sends:

```ts
import { createSSRApp } from 'vue'
import { renderToString } from 'vue/server-renderer'
import { createRouter } from '@kitbag/router'
import App from './App.vue'
import { routes } from './routes'

export async function handleRequest(url: string) {
  const router = createRouter(routes, {
    initialUrl: url,
    ssr: true,
  })
  const app = createSSRApp(App)

  app.use(router)

  const response = await router.render()

  if (response.kind === 'redirect') {
    return { status: response.status, location: response.location }
  }

  return {
    status: response.status,
    html: `
      <!DOCTYPE html>
      <html>
        <head><title>${response.title ?? 'My App'}</title></head>
        <body>
          <div id="app">${await renderToString(app)}</div>
          ${response.payload}
        </body>
      </html>
    `,
  }
}
```

::: warning
Install the router before calling `render`. Props getters and loaders run inside the vue app's context,
so anything they `inject` would silently get nothing.
:::

The server responds one hop at a time: the first redirect of a render is returned without being
followed, the browser follows it, and the next request picks up from there. A normalized url, such as
one with a trailing slash removed, and a [route redirect](/advanced-concepts/redirects) respond with a
`302` by default — set [`redirectStatus`](/api/types/RouterOptions#redirectstatus) to change it, or
declare a status on an individual route redirect. A push or replace from a hook, props getter, or
loader always responds `302`: the url was valid, it just took the visitor elsewhere.

## Hydration

A router created in the browser adopts a payload it finds: the route or rejection is committed
before anything renders, props getters and loaders are given the values the server settled on in
place of running, and before hooks are not re-run.

A rendering router never runs after hooks: the response returns what the navigation committed and
nothing after that. Client side effects like analytics belong in after hooks — they run once, in
the browser, whether the navigation was live or hydrated.

## Payload values

Payload values are sent as json. A value that cannot be encoded is left out of the payload, and the
client computes it again — the server warns and returns each one on the `render` response as `failures`,
and the client warns for every value it expected but did not receive. A props getter or loader can
declare how its value is sent instead with a `transformer`:

```ts
const route = createRoute({ ... }).addLoader(loadLocations, {
  transformer: {
    stringify: (locations) => JSON.stringify(Array.from(locations.entries())),
    parse: (encoded) => new Map(JSON.parse(encoded)),
  },
})
```

A default can be specified on the router options, applying to every value that does not declare its
own.

::: warning
Json silently changes some values rather than failing: a `Date` becomes a string, and a `Map` or `Set`
becomes an empty object. The client adopts a different value than the server rendered with, which
produces hydration mismatches. If your props getters or loaders return anything beyond plain json, we
recommend [superjson](https://github.com/flightcontrolhq/superjson) — it carries all of these and
matches the `transformer` option's shape directly. A custom class is beyond even superjson's defaults —
declare a `transformer` (or a superjson custom transformer) for those values:

```ts
import superjson from 'superjson'

const router = createRouter(routes, {
  transformer: superjson,
})
```
:::
