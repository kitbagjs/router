# Hooks: onBeforeRouteLeave

```ts
const onBeforeRouteLeave: AddBeforeRouteHook;
```

Registers a hook that is called before a route is left. Must be called from setup.
This is useful for performing actions or cleanups before navigating away from a route component.

## Param

The hook callback function

## Returns

A function that removes the added hook.
