# Defining Routes

## Basics

Kitbag Router provides `createRoutes`, which provides the type you'll need to supply when creating your router.

```ts
import { createRoutes } from '@kitbag/router'

const routes = createRoutes([
  { name: 'home', path: '/', component: Home },
  { name: 'path', path: '/about', component: About },
])

const router = createRouter(routes)
```

## Nested Routes

When your application supports nested component views, you can use nested routes to support this behavior with router. The `children` value should use `createRoutes` at each level.

```ts
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
        children: createRoutes([
          { name: 'keys', path: '/keys', component: ... },
          { name: 'notifications', path: '/notifications', component: ... },
        ])
      }
    ])
  }
])
```

Any Route can have `children`, though to have those children's components be rendered correctly you need to put a `<router-view />` component somewhere in the parent's template. Alternatively, you can omit `component` from the parent route, since router assumes any route that has `children` and doesn't explicitly declare a `component` wants to mount `RouterView`.

## Route Names

Providing the `name` property for each route ensures that we have a way of programmatically navigating. Having names for parent routes also ensures that the parent is part of the hierarchal key of any child routes.

With the example user routes above

```ts
const router = createRouter(routes)

router.push('user.settings.keys')
```

Learn more about [navigating](/core-concepts/navigating) to routes.

## Disabled Routes

When an individual route is disabled, it will never count as an exact match. Children of disabled route behave normally and can still be matched. This gives the developer the ability to ensure that partial views are not loaded without having to flatten your routes and lose the context of nested routes.

Let's update the example above

```ts
const routes = createRoutes([
  {
    name: 'user',
    path: '/user',
    disabled: true, // [!code focus] 
    component: ...,
    children: createRouter([
      ...
    ])
  }
])
```

Now developers would get a Typescript error if they try navigating to `routes.user`.

```ts
const router = createRouter(routes)

router.push('routes.user') // [!code error] error
router.push('routes.user.profile') // ok
```

## Case Sensitivity

By default route paths are NOT case sensitive. If you need part of your route to be case sensitive, we recommend using a [Regex Param](/core-concepts/route-params#regexp-params).
