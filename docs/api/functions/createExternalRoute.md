# Functions: createExternalRoute()

## Call Signature

```ts
function createExternalRoute<TOptions>(options): ToRoute<TOptions> & ExternalRouteHooks<ToRoute<TOptions>, TOptions["context"]> & RouteRedirects<ToRoute<TOptions>>;
```

### Type Parameters

| Type Parameter |
| ------ |
| <a id="type-parameter-toptions"></a> `TOptions` *extends* [`CreateRouteOptions`](../types/CreateRouteOptions.md) & [`WithHost`](../types/WithHost.md) & [`WithoutParent`](../types/WithoutParent.md) |

### Parameters

| Parameter | Type |
| ------ | ------ |
| `options` | `TOptions` |

### Returns

[`ToRoute`](../types/ToRoute.md)\<`TOptions`\> & `ExternalRouteHooks`\<[`ToRoute`](../types/ToRoute.md)\<`TOptions`\>, `TOptions`\[`"context"`\]\> & [`RouteRedirects`](../types/RouteRedirects.md)\<[`ToRoute`](../types/ToRoute.md)\<`TOptions`\>\>

## Call Signature

```ts
function createExternalRoute<TOptions>(options): ToRoute<TOptions> & ExternalRouteHooks<ToRoute<TOptions>, ExtractRouteContext<TOptions>> & RouteRedirects<ToRoute<TOptions>>;
```

### Type Parameters

| Type Parameter |
| ------ |
| <a id="type-parameter-toptions-1"></a> `TOptions` *extends* [`CreateRouteOptions`](../types/CreateRouteOptions.md) & [`WithoutHost`](../types/WithoutHost.md) & [`WithParent`](../types/WithParent.md) |

### Parameters

| Parameter | Type |
| ------ | ------ |
| `options` | `TOptions` |

### Returns

[`ToRoute`](../types/ToRoute.md)\<`TOptions`\> & `ExternalRouteHooks`\<[`ToRoute`](../types/ToRoute.md)\<`TOptions`\>, `ExtractRouteContext`\<`TOptions`\>\> & [`RouteRedirects`](../types/RouteRedirects.md)\<[`ToRoute`](../types/ToRoute.md)\<`TOptions`\>\>
