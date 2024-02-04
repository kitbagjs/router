# Navigating

The most common way of navigating is with the `<router-link/>` component inside your Vue components. However, you can also navigate programmatically from anywhere.

## Push

To navigate to another route, you can use `router.push`. This method will update the URL for the browser and also add the URL into the history so when a user uses the back button on their browser it will behave as expected.

```ts
const routes = [
  {
    name: 'user',
    path: '/user',
    component: ...,
    children: [
      {
        name: 'profile',
        path: '/profile',
        component: ...,
      },
      {
        name: 'settings',
        path: '/settings',
        component: ...,
      }
    ]
  }
] as const satisfies Routes

const router = useRouter(routes)

router.push({ route: 'user.settings' })
```

The push method also accepts a plain string if you know the URL you want to go to.

```ts
router.push('/user/settings')
```

Using push with the route object syntax provides a much better developer experience. The `route` property is typesafe, expecting only a "path" that uses route names separated by a period `.` that lead to a non-disabled route. Furthermore, if your route has any params, the route object syntax will require that those params be passed in.

### Providing Params

When navigating to a route that has params, the router will require those params be given in the correct type.

```ts
const routes = [
  {
    name: 'user',
    path: '/user', // [!code --]
    path: '/user/:id', // [!code ++]
    component: ...,
    children: [
      {
        name: 'profile',
        path: '/profile',
        component: ...,
      },
      {
        name: 'settings',
        path: '/settings',
        query: 'tab=:?tab', // [!code ++]
        component: ...,
      }
    ]
  }
] as const satisfies Routes

const router = useRouter(routes)

router.push({ route: 'user.settings' }) // [!code --]
router.push({ route: 'user.settings', params: { id: 42, tab: 'github' } }) // [!code ++]
```

### Query

With the optional 2nd argument, you add additional query params. Note if you know your route will expect certain parameters, [query params](/core-concepts/query-params) is a much better developer experience for dealing with the query.

```ts
router.push({ route: 'user.settings' }, {
  query: { foo: 'bar' },
  replace: true
})
```

## Replace

If you want to change the current route without pushing an entry to the browser's history, you can use `router.replace`.

```ts
router.replace({ route: 'user.settings' })
```

Push also let's you pass `replace: true` to achieve the same behavior.

```ts
router.push({ route: 'user.settings' }, { replace: true })
```

## Route Methods

The router also provides an alternative syntax that encapsulates the route properties in a callback method.

```ts
const routes = [
  {
    name: 'user',
    path: '/user',
    component: ...,
    children: [
      {
        name: 'profile',
        path: '/profile',
        component: ...,
      },
      {
        name: 'settings',
        path: '/settings',
        component: ...,
      }
    ]
  }
] as const satisfies Routes

const { routes } = useRouter(routes) // [!code focus]

routes.user.profile() // [!code focus]
```

Calling this method returns the context for the route, which can later be used to actually navigate. This context includes a `url` string as well as `push` and `replace` methods, which have the same syntax as `router.push` and `router.replace`.

[example that demonstrates the value]
