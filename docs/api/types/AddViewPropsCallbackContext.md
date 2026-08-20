# Types: AddViewPropsCallbackContext\<TRoute\>

```ts
type AddViewPropsCallbackContext<TRoute> = RouteCallbackContext<TRoute>;
```

Context provided to an `addView` props getter. The same context a loader is given, since both are
callbacks attached to a route.

## Type Parameters

| Type Parameter |
| ------ |
| `TRoute` *extends* [`Route`](Route.md) |
