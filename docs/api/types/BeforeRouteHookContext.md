# Types: BeforeRouteHookContext

```ts
type BeforeRouteHookContext: RouteHookContext & object;
```

Context provided to route hooks, containing context of previous route and functions for triggering rejections, push/replace to another route,
as well as aborting current route change.

## Type declaration

### abort

```ts
abort: CallbackContextAbort;
```
