# Rejections

Kitbag Router ships with built in support for rejection handling. Each rejection type you need is registered with a corresponding view, if rejections happen at any point in the router lifecycle the router will handle it.

Rejections are routes selected by `reject()` or, for `NotFound`, when no route matches. They replace the requested route and its layouts while keeping its URL. Rejection names must be unique among routes and rejections.

## Rejection Types

Creating custom rejections is extremely easily with the [`createRejection`](/api/functions/createRejection) utility. For example, we can add a custom rejection for "AuthNeeded".

```ts
import { createRejection, createRouter } from '@kitbag/router'

const authNeededRejection = createRejection({
  name: 'AuthNeeded',
  status: 401,
})

export const router = createRouter(routes, {
  rejections: [authNeededRejection]
})
```

The `status` is the [http status](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Status) a
server should respond with while the rejection is in effect, read by [router.render](/core-concepts/router#render)
when [server rendering](/advanced-concepts/server-side-rendering). It is optional: a rejection without
its own responds with the router's [`rejectStatus`](/api/types/RouterOptions#rejectstatus), `200` by default.

<aside class="version-note" role="note">

**Version note:** Rejections became inferred from router options in [0.8.1](/upgrading/0.8.1); reusable rejection definitions replaced the options object in [0.20.11](/upgrading/0.20.11#rejection-definitions).

</aside>

The `type` option and rejection `.type` property are deprecated aliases for `name`. Existing definitions continue to work.

## Rejection Component

When a rejection happens, Kitbag router mounts whatever component you passed to `addView`. If no component was assigned, Kitbag router will use the default rejection component that ships with Kitbag Router.

`addView` supports [named views](/core-concepts/routes#named-views) and [props getters](/core-concepts/component-props). The `component` option remains supported but is deprecated in favor of `addView`.

```ts {1,7}
import LoginView from '@/views/LoginView.vue'

const authNeededRejection = createRejection({
  name: 'AuthNeeded',
  status: 401,
})
  .addView(LoginView)
```

Now if your `AuthNeeded` rejection is triggered, the `LoginView` component will be mounted.

## Built-In Rejections

Every new router has a `NotFound` rejection by default. This enables the default behavior of the router when it's given a URL that doesn't match any of your routes. Instead of the user having to define a 404/catch-all route, Kitbag router solves this problem for you.

### Overriding Built-In Rejection Components

You'll probably want to provide your own component to display to users when they end up somewhere unexpected. To override the default behavior, simply create a new rejection with the same name that includes your desired component.

```ts
import NotFoundPage from '@/components/NotFoundPage.vue'

const notFoundRejection = createRejection({
  name: 'NotFound',
  status: 404,
})
  .addView(NotFoundPage)

export const router = createRouter(routes, {
  rejections: [notFoundRejection]
})
```

## Trigger Rejection

Any of the [hooks](/advanced-concepts/hooks) will provided a `reject` function in the context argument. The [props getter](/core-concepts/component-props#async-prop-fetching) passed to `addView` also provides a `reject` function.

```ts
const route = createRoute({...})
  .onBeforeRouteEnter((to, { reject }) => {
    reject('AuthNeeded')
  })
```

Alternatively, you can always trigger a rejection from `router.reject`.

```ts
import { useRouter } from '@kitbag/router'

const router = useRouter()

function maybeAuthNeeded() {
  ...
  router.reject('AuthNeeded')
}
```

Call `router.refresh()` to retry the requested URL after resolving the rejection, for example after signing in. Rejections support the same before/after enter, update, and leave hooks as routes, including navigation controls. Global hooks also run for rejections; check `to.kind === 'rejection'` when a guard should skip them. `onRejection` still fires when a rejection is requested, before its navigation begins.

### Get Rejection

While a rejection is displayed, `router.route` and `useRoute()` return the rejection as the current route. It has its own `name` and `kind: 'rejection'`, with no typed URL params. Its nullable `source` contains the originally matched route; it is `null` if no route matched.

```ts
const route = useRoute('AuthNeeded')

route.name // 'AuthNeeded'
route.href // The requested URL
route.source?.name // The originally matched route, if any
```

Though it's uncommon, your rejection components could access to the current rejection with `useRejection` if you need it.

```ts
import { useRejection } from '@kitbag/router'

const rejection = useRejection()

const rejectionName = computed(() => rejection.value?.name)
```

## Loaders

Add [loaders](/core-concepts/loaders) to fetch data for a rejection. They run when the rejection is selected, and its component can read their results with `useLoader`. The rejection does not inherit the requested route's loader results.

```ts
import { sessionLoader } from '@/loaders/session'

const authNeededRejection = createRejection({...})
  .addLoader(sessionLoader)
```

## Title

The `setTitle` callback is used to set the document title for the rejection. The callback is given the resolved route and a context object. The callback can be async, and should return a string that should be set as the document.title.

The callback receives the rejection as `to`. Rejections do not inherit the requested route's title.

The context object has the following properties:

| Property | Type | Description |
| -------- | ---- | ----------- |
| getParentTitle | () => Promise<string \| undefined> | Resolves to `undefined` because rejections have no parent route. |

```ts
import { createRejection } from '@kitbag/router'

const authNeededRejection = createRejection({
  name: 'AuthNeeded',
  status: 401,
})

authNeededRejection.setTitle((to, context) => {
  return `Unauthorized!`
})
```
