# Hooks: onAfterRouteUpdate

```ts
const onAfterRouteUpdate: AddAfterRouteHook;
```

Registers a hook that is called after a route has been updated. Must be called during setup.
This is ideal for responding to updates within the same route, such as parameter changes, without full component reloads.

## Param

The hook callback function

## Returns

A function that removes the added hook.
