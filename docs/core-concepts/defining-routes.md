# Defining Routes

## Typesafety

For typesafety to work properly we need to make sure Typescript doesn't widen your routes.

```ts
export const routes = [// [!code ++]
  { name: 'home', path: '/', component: Home },// [!code ++]
  { name: 'path', path: '/about', component: About },// [!code ++]
] as const satisfies Routes // [!code ++]

export const routes: Routes = [// [!code --]
  { name: 'home', path: '/', component: Home },// [!code --]
  { name: 'path', path: '/about', component: About },// [!code --]
]// [!code --]
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
        path: '',
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
const { routes } = createRouter(routes)

// navigate to /user/settings/keys route
routes.user.settings.keys()
```

Learn more about [navigating](/core-concepts/navigating) to routes.

::: info
While there are no constraints on what you pick for the name, we recommend camelCase strings which will feel the most natural when using the route methods for navigation.
:::

## Public Routes

By default, the routes you define are considered to be "public". This means the route will be callable in the `routes` response from `createRouter`. If your desire is to setup a parent route that's not accessible itself, you can set that parent as non-public.

Let's update the example above

```ts
const routes = [
  {
    name: 'user',
    path: '/user',
    public: false, // [!code focus] 
    component: ...,
    children: [
      ...
    ]
  }
] as const satisfies Routes
```

Now `routes.user` is no longer callable

```ts
const { routes } = createRouter(routes)

routes.user() // [!code error] This expression is not callable
```
