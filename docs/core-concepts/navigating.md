# Navigating

The most common way of navigating is with the `<router-link/>` component inside your Vue components. However, you can also navigate programmatically from anywhere.

## Push

To navigate to another route, you can use `router.push`. This method will update the URL for the browser and also add the URL into the history so when a user uses the back button on their browser it will behave as expected.

```ts
import { createRoutes, useRouter } from '@kitbag/router'

const routes = createRoutes([
  {
    name: 'user',
    path: '/user',
    component: ...,
    children: createRoutes([
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
    ])
  }
])

const router = useRouter(routes)

router.push('user.settings')
```

The push method also accepts a plain string if you know the URL you want to go to.

```ts
router.push('/user/settings')
router.push('https://github.com/kitbagjs/router')
```

This `source` argument is type safe, expecting either a [`Url`](/api/types/Url) or a valid route [`Key`](/api/types/Route#key). URL is any string that starts with "http", "https", or a forward slash "/". Route key is a string of route names joined by a period `.` that lead to a non-disabled route. Additionally if using the route key, push will require params be passed in if there are any.

### Providing Params

When navigating to a route that has params, the router will require those params be given in the correct type.

```ts
const routes = createRoutes([
  {
    name: 'user',
    path: '/user', // [!code --]
    path: '/user/[id]', // [!code ++]
    component: ...,
    children: createRoutes([
      {
        name: 'profile',
        path: '/profile',
        component: ...,
      },
      {
        name: 'settings',
        path: '/settings',
        query: 'tab=[?tab]', // [!code ++]
        component: ...,
      }
    ])
  }
])

const router = useRouter(routes)

router.push('user.settings') // [!code --]
router.push('user.settings', { id: 42, tab: 'github' }) // [!code ++]
```

### Query

With the options argument, you add additional values to the query. Note if you know your route will expect certain parameters, [query params](/core-concepts/query-params) is a much better developer experience for dealing with the query.

```ts
router.push('user.settings', params, {
  query: { foo: 'bar' },
})
```

If using push with a URL, there is no params argument so options will be the 2nd arg

```ts
router.push('/user/settings', {
  query: { foo: 'bar' },
})
```

## Replace

If you want to change the current route without pushing an entry to the browser's history, you can use `router.replace`.

```ts
router.replace('user.settings')
```

Push also let's you pass `replace: true` to achieve the same behavior.

```ts
router.push('user.settings', params, { replace: true })
```

## Update

If you only wish to change the params on the current route you can use `router.route.update`.

```ts
router.route.update('myParam': 123)
```

or for setting multiple params at once

```ts
router.route.update({
  myParam: 123,
  tab: 'github',
})
```
