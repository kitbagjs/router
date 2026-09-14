# Server Side Rendering

Props and loaders deliberately never hold up a navigation, which is what keeps the client free of
request waterfalls. A server has nothing to progressively reveal to, so it needs a point at which the
page is finished. That is what [ssr](/core-concepts/router#ssr) is for.

## Rendering a request

```ts
import { createSSRApp } from 'vue'
import { renderToString } from 'vue/server-renderer'
import { createRouter } from '@kitbag/router'
import App from './App.vue'
import { routes } from './routes'

export async function handleRequest(url: string) {
  const router = createRouter(routes, { initialUrl: url })
  const app = createSSRApp(App)

  app.use(router)

  const response = await router.ssr()

  if (response.location) {
    return { status: response.status, location: response.location }
  }

  return { status: response.status, html: await renderToString(app) }
}
```

::: warning
Install the router before calling `ssr`, and call `ssr` right away. Props getters and loaders run
inside the vue app's context, so `app.use(router)` has to happen first or anything they `inject` will
silently get nothing — and calling `ssr` is what marks the navigation as a server render, so after
hooks are left for the client.
:::

## The response

`ssr` resolves with a `ServerRenderResponse`. `location` is only present on a redirect, so checking it
is what proves there is a `Location` header to send:

| status | when |
| -- | -- |
| `200` | the route rendered |
| `302` | the url was normalized, or a route, props getter or loader redirected |
| `404` | the url matched no route |
| anything else | declared by the [rejection](/advanced-concepts/rejections) in effect |

`rejection` carries the type of the rejection in effect, or `null`. It is typed as the rejection types
your router knows about, so a server can respond to specific ones:

```ts
if (response.rejection === 'Unauthorized') {
  return { status: 302, location: '/login' }
}
```

## Redirect status

A url the router normalized, such as one with a trailing slash removed, returns a `302` by default. To
change that, set `redirectStatus`:

```ts
const router = createRouter(routes, {
  redirectStatus: 301,
})
```

## Hydration

`ssr` also resolves with everything a client needs to adopt the outcome instead of computing it
again. `title` is the title of the route or rejection that rendered, and `payload` is a script tag
containing the values every props getter and loader returned. Embed both in the html the server sends:

```ts
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
```

A router created in the browser adopts a payload it finds: the route or rejection is committed
before anything renders, props getters and loaders are given the values the server settled on in
place of running, and before hooks are not re-run.

A rendering router never runs after hooks: the response returns what the navigation committed and
nothing after that. Client side effects like analytics belong in after hooks — they run once, in
the browser, whether the navigation was live or hydrated.

## Payload values

Payload values are sent as json. A value json cannot carry is left out of the payload, and the
client computes it again. A props getter or loader can declare how its value is sent instead with a
`payload` option:

```ts
const route = createRoute({ ... }).addLoader(loadLocations, {
  payload: {
    stringify: (locations) => JSON.stringify(Array.from(locations.entries())),
    parse: (encoded) => new Map(JSON.parse(encoded)),
  },
})
```

A default can be specified on the router options, applying to every value that does not declare its
own. A declared option that cannot write a value or read it back throws a `PayloadValueError`.
