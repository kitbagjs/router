# Reusing Param Names

Both path params and query params support using the same param name multiple times in the same path.

```ts {4,9,14}
const routes = [
  {
    name: 'account',
    path: '/accounts/:id',
    component: ...,
    children: [
      {
        name: 'workspace',
        path: '/workspaces/:id',
        component: ...,
        children: [
          { 
            name: 'key', 
            path: '/keys/:id', 
            component: ... 
          },
        ]
      }
    ]
  }
] as const satisfies Routes
```

Notice how in this example the param `id` is used at every level. The router treats this as a single param with a value that is a tuple with each occurrence having a spot. So calling `router.push({ route:'account.workspace.key' })`, would expect `params: { id: [string, string, string] }`.

```ts
router.push({ route: 'account.workspace.key', params: { id: ['a', 'b', 'c'] } })

// results in url -> "/accounts/a/workspaces/b/keys/c"
```

If reused names includes both path and query params, the order of the resulting tuple is determined by `path` params in order they occur, then `query` params in the order they occur. While this is an extreme example, this demonstrates the logic for ordering the tuple.

```ts
const routes = [
  {
    name: 'account',
    path: '/accounts/:id',
    query: 'id=:id'
    component: ...,
    children: [
      {
        name: 'workspace',
        path: '/workspaces/:id',
        query: 'id=:id'
        component: ...,
        children: [
          { 
            name: 'key', 
            path: '/keys/:id', 
            query: 'id=:id'
            component: ... 
          },
        ]
      }
    ]
  }
] as const satisfies Routes
```

So now calling `router.push({ route:'account.workspace.key' })`, would expect params

```ts
{
  id: [
    string, // account path
    string, // workspace path
    string, // key path
    string, // account query
    string, // workspace query
    string, // key query
  ]
}
```
