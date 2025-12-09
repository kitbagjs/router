# Compositions: useLink

```ts
const useLink: RouterAssets<RegisteredRouter>["useLink"];
```

A composition to export much of the functionality that drives RouterLink component.
Also exports some useful context about routes relationship to current URL and convenience methods
for navigating.

## Param

The name of the route or a valid URL.

## Param

If providing route name, this argument will expect corresponding params.

## Param

[RouterResolveOptions](../types/RouterResolveOptions.md) Same options as router resolve.

## Returns

Reactive context values for as well as navigation methods.
