# Hooks: onAfterRouteLeave

```ts
const onAfterRouteLeave: AddAfterRouteHook;
```

Registers a hook that is called after a route has been left. Must be called during setup.
This can be used for cleanup actions after the component is no longer active, ensuring proper resource management.

## Param

The hook callback function

## Returns

A function that removes the added hook.
