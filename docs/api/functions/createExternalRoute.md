# Functions: createExternalRoute()

## Call Signature

```ts
function createExternalRoute<TOptions>(options): ToRoute<TOptions> & ExternalRouteHooks<ToRoute<TOptions>, TOptions["context"]> & RouteRedirects<ToRoute<TOptions>>;
```

### Type Parameters

| Type Parameter |
| ------ |
| `TOptions` *extends* [`CreateRouteOptions`](../types/CreateRouteOptions.md) & [`WithHost`](../types/WithHost.md) & [`WithoutParent`](../types/WithoutParent.md) |

### Parameters

| Parameter | Type |
| ------ | ------ |
| `options` | `TOptions` |

### Returns

[`ToRoute`](../types/ToRoute.md)\<`TOptions`\> & [`ExternalRouteHooks`](../types/ExternalRouteHooks.md)\<[`ToRoute`](../types/ToRoute.md)\<`TOptions`\>, `TOptions`\[`"context"`\]\> & `RouteRedirects`\<[`ToRoute`](../types/ToRoute.md)\<`TOptions`\>\>

## Call Signature

```ts
function createExternalRoute<TOptions>(options): ToRoute<TOptions> & ExternalRouteHooks<ToRoute<TOptions>, ExtractRouteContext<TOptions>> & RouteRedirects<ToRoute<TOptions>>;
```

### Type Parameters

| Type Parameter |
| ------ |
| `TOptions` *extends* [`CreateRouteOptions`](../types/CreateRouteOptions.md) & [`WithoutHost`](../types/WithoutHost.md) & [`WithParent`](../types/WithParent.md) |

### Parameters

| Parameter | Type |
| ------ | ------ |
| `options` | `TOptions` |

### Returns

[`ToRoute`](../types/ToRoute.md)\<`TOptions`\> & [`ExternalRouteHooks`](../types/ExternalRouteHooks.md)\<[`ToRoute`](../types/ToRoute.md)\<`TOptions`\>, `ExtractRouteContext`\<`TOptions`\>\> & `RouteRedirects`\<[`ToRoute`](../types/ToRoute.md)\<`TOptions`\>\>
