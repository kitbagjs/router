# RouteHookResponse

```ts
type RouteHookResponse<TRoutes>: BeforeRouteHookResponse<TRoutes> | AfterRouteHookResponse<TRoutes>;
```

Union type for all possible route hook responses, covering both before and after scenarios.

## Type parameters

| Type parameter | Description |
| :------ | :------ |
| `TRoutes` *extends* [`Routes`](Routes) | The type of the routes configuration. |
