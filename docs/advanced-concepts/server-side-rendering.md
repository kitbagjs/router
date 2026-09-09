# Server Side Rendering

Props and loaders deliberately never hold up a navigation, which is what keeps the client free of
request waterfalls. A server has nothing to progressively reveal to, so it needs a point at which the
page is finished. That is what [render](/core-concepts/router#render) is for.

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

  const outcome = await router.render()

  if (outcome.location) {
    return { status: outcome.status, location: outcome.location }
  }

  return { status: outcome.status, html: await renderToString(app) }
}
```

::: warning
Install the router before calling `render`. Props getters and loaders run inside the vue app's context,
so `app.use(router)` has to happen first or anything they `inject` will silently get nothing.
:::

## The outcome

`render` resolves with a `RenderOutcome`. `location` is only present on a redirect, so checking it is
what proves there is a `Location` header to send:

| status | when |
| -- | -- |
| `200` | the route rendered |
| `302` | the url was normalized, or a route, props getter or loader redirected |
| `404` | the url matched no route |
| anything else | declared by the [rejection](/advanced-concepts/rejections) in effect |

`rejection` carries the type of the rejection in effect, or `null`. It is typed as the rejection types
your router knows about, so a server can respond to specific ones:

```ts
if (outcome.rejection === 'Unauthorized') {
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

## What is not handled yet

The server renders complete html, but nothing is serialized into the payload for the client to pick
up. So the browser runs every props getter and loader again on hydration, and vue reports a mismatch
wherever content differs. Treat this as server rendered html rather than full hydration support.
