# Types: ResolvedRoute\<TRoute\>

```ts
type ResolvedRoute<TRoute> = Readonly<{
  hash: string;
  hooks: Hooks[];
  href: Url;
  id: TRoute["id"];
  matched: TRoute["matched"];
  matches: TRoute["matches"];
  name: TRoute["name"];
  params: ExtractUrlParamTypesReading<TRoute>;
  query: URLSearchParams;
  state: ExtractRouteStateParamsAsOptional<TRoute["state"]>;
}>;
```

Represents a route that the router has matched to current browser location.

## Type Parameters

| Type Parameter | Default type | Description |
| ------ | ------ | ------ |
| `TRoute` *extends* [`Route`](Route.md) | [`Route`](Route.md) | Underlying Route that has been resolved. |
