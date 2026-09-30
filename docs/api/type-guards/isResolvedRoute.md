# Type Guards: isResolvedRoute()

```ts
function isResolvedRoute(value): value is Readonly<{ canonical: UrlString; getTitle: GetTitleCallback; hash: string; href: UrlString; id: string; matched: CreatedRouteOptions; matches: CreatedRouteOptions[]; name: string; params: { [key: string]: unknown }; query: URLSearchParams; state: ExtractRouteStateParamsAsOptional<TRoute["state"]> }> & ResolvedRouteInternal;
```

A type guard for determining if a value is a ResolvedRoute.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `value` | `unknown` | The value to check. |

## Returns

`value is Readonly<{ canonical: UrlString; getTitle: GetTitleCallback; hash: string; href: UrlString; id: string; matched: CreatedRouteOptions; matches: CreatedRouteOptions[]; name: string; params: { [key: string]: unknown }; query: URLSearchParams; state: ExtractRouteStateParamsAsOptional<TRoute["state"]> }> & ResolvedRouteInternal`

`true` if the value is a ResolvedRoute, otherwise `false`.
