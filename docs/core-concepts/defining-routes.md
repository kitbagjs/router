# Defining Routes

## Type Safety

For type safety to work properly we need to make sure Typescript doesn't widen your routes.

```ts
/* type safe */
export const routes = [
  { name: 'home', path: '/', component: Home },
  { name: 'path', path: '/about', component: About },
] as const satisfies Routes 

/* not type safe */
export const routes: Routes = [
  { name: 'home', path: '/', component: Home },
  { name: 'path', path: '/about', component: About },
]
```

::: info
The [satisfies](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-4-9.html) operator was introduced to Typescript in v4.9.
:::

## Nested Routes

When your application supports nested component views, you can use nested routes to support this behavior with router.  

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
        children: [
          { name: 'keys', path: '/keys', component: ... },
          { name: 'notifications', path: '/notifications', component: ... },
        ]
      }
    ]
  }
] as const satisfies Routes
```

Any Route can have `children`, though to have those children's components be rendered correctly you need to put a `<router-view />` component somewhere in the parent's template. Alternatively, you can omit `component` from the parent route, since router assumes any route that has `children` and doesn't explicitly declare a `component` wants to mount `RouterView`.

## Route Names

Providing the `name` property for each route ensures that we have a way of programmatically navigating. Having names for parent methods also ensures that the parent is part of the ancestry chain of child route methods.

With the example user routes above

```ts
const router = createRouter(routes)

router.push({ route: 'user.settings.keys' })
```

Learn more about [navigating](/core-concepts/navigating) to routes.

::: info
While there are no constraints on what you pick for the name, we recommend camelCase strings which will feel the most natural when using the route methods for navigation.
:::

## Disabled Routes

When an individual route is disabled, it will never count as an exact match. Children of disabled route behave normally and can still be matched. This gives the developer the ability to ensure that partial views are not loaded without having to flatten your routes and lose the context of nested routes.

Let's update the example above

```ts
const routes = [
  {
    name: 'user',
    path: '/user',
    disabled: true, // [!code focus] 
    component: ...,
    children: [
      ...
    ]
  }
] as const satisfies Routes
```

Now developers would get a Typescript error if they try navigating to `routes.user`.

```ts
const router = createRouter(routes)

router.push({ route: 'routes.user' }) // [!code error] error
router.push({ route: 'routes.user.profile' }) // ok
```
