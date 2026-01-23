# Rejections

Kitbag Router ships with built in support for rejection handling. Each rejection type you need is registered with a corresponding view, if rejections happen at any point in the router lifecycle the router will handle it.

## Rejection Types

Creating custom rejections is extremely easily with the [`createRejection`](/api/functions/createRejection) utility. For example, we can add a custom rejection for "AuthNeeded".

```ts
import { createRejection, createRouter } from '@kitbag/router'

const authNeededRejection = createRejection({
  type: 'AuthNeeded',
})

export const router = createRouter(routes, {
  rejections: [authNeededRejection]
})
```

## Rejection Component

When a rejection happens, Kitbag router mounts whatever component you passed in to the `component` property. If no component was assigned, Kitbag router will use the default rejection component that ships with Kitbag Router.

```ts {1,5}
import LoginView from '@/views/LoginView.vue'

const authNeededRejection = createRejection({
  type: 'AuthNeeded',
  component: LoginView,
})
```

Now if your `AuthNeeded` rejection is triggered, the `LoginView` component will be mounted.

## Built-In Rejections

Every new router has a `NotFound` rejection by default. This enables the default behavior of the router when it's given a URL that doesn't match any of your routes. Instead of the user having to define a 404/catch-all route, Kitbag router solves this problem for you.

### Overriding Built-In Rejection Components

You'll probably want to provide your own component to display to users when they end up somewhere unexpected. To override the default behavior, simply create a new rejection with the same name that includes your desired component.

```ts
import NotFoundPage from '@/components/NotFoundPage.vue'

const notFoundRejection = createRejection({
  type: 'NotFound',
  component: NotFoundPage,
})

export const router = createRouter(routes, {
  rejections: [notFoundRejection]
})
```

## Trigger Rejection

Any of the [hooks](/advanced-concepts/hooks) will provided a `reject` function in the context argument. The [async prop function](/core-concepts/component-props#async-prop-fetching) argument of `createRoute` also will provide a `reject` function.

```ts
route.onBeforeRouteEnter((to, { reject }) => {
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

### Get Rejection

Though it's uncommon, your rejection components could access to the current rejection with `useRejection` if you need it.

```ts
import { useRejection } from '@kitbag/router'

const rejection = useRejection()

const rejectionType = computed(() => rejection.value.type)
```
