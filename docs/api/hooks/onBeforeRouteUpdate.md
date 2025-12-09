# Hooks: onBeforeRouteUpdate

```ts
const onBeforeRouteUpdate: RouterAssets<RegisteredRouter>["onBeforeRouteUpdate"];
```

Registers a hook that is called before a route is updated. Must be called from setup.
This is particularly useful for handling changes in route parameters or query while staying within the same component.

## Param

The hook callback function

## Returns

A function that removes the added hook.
