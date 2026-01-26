# Route Matching

There are several rules Kitbag Router uses to determine which of your routes corresponds to the current URL.

## Named

Routes without a [name](/core-concepts/routes#name) property cannot be matched.

## Path Matches

Routes `path` must match the structure of the URL pathname.

```ts
const route {
  ...
  path: '/parent/anything/child'
}
```

:white_check_mark: `parent/anything/child`  
:x: `parent/123/child`  
:x: `parent//child`  
:x: `parent/child`  

```ts
const route {
  ...
  path: '/parent/[myParam]/child'
}
```

:white_check_mark: `parent/anything/child`  
:white_check_mark: `parent/123/child`  
:x: `parent//child`  
:x: `parent/child`  

```ts
const route {
  ...
  path: '/parent/[?myParam]/child'
}
```

:white_check_mark: `parent/anything/child`  
:white_check_mark: `parent/123/child`  
:white_check_mark: `parent//child`  
:x: `parent/child`  

## Query Matches

Routes `query` must match the structure of the URL search.

```ts
const route {
  ...
  query: 'foo=bar'
}
```

:white_check_mark: `?foo=bar`  
:white_check_mark: `?kitbag=cat&foo=bar`  
:x: `?foo=123`  
:x: `?foo`  

```ts
const route {
  ...
  query: 'foo=[bar]'
}
```

:white_check_mark: `?foo=bar`  
:white_check_mark: `?kitbag=cat&foo=bar`  
:white_check_mark: `?foo=123`  
:x: `?foo`  

```ts
const route {
  ...
  query: 'foo=[?bar]'
}
```

:white_check_mark: `?foo=bar`  
:white_check_mark: `?kitbag=cat&foo=bar`  
:white_check_mark: `?foo=123`  
:white_check_mark: `?foo`  

::: tip
when your query param is optional, the entire property can be missing and the route will still match. For the example above with query `foo=[?bar]`, the url might be `/my-route` without any query, or it might have an unrelated query `/my-route?other=value`, and still be a match because the entire foo param is optional.
:::

## Params Are Valid

Assuming a route's path and query match the structure of the URL, the last test is to make sure that values provided by the URL pass the Param parsing. By default params are assumed to be strings, so by default if structure matches, parsing will pass as well since the URL is a string. However, if you define your params with `Boolean`, `Number`, `Date`, `JSON`, or a custom `Param` the value will be need to pass the param's `get` function.

```ts
const route {
  ...
  path: '/parent/[id]'
  query: 'tab=[?tab]'
}
```

:white_check_mark: `parent/123`  
:white_check_mark: `parent/123?tab=true`  
:white_check_mark: `parent/123?tab=github`  
:white_check_mark: `parent/ABC?tab=true`  

```ts
const route {
  ...
  path: withParams('/parent/[id]', { id: Number })
  query: 'tab=[?tab]'
}
```

:white_check_mark: `parent/123`  
:white_check_mark: `parent/123?tab=true`  
:white_check_mark: `parent/123?tab=github`  
:x: `parent/ABC?tab=true`  

```ts
const route {
  ...
  path: withParams('/parent/[id]', { id: Number })
  query: withParams('tab=[?tab]', { tab: Boolean })
}
```

:white_check_mark: `parent/123`  
:white_check_mark: `parent/123?tab=true`  
:x: `parent/123?tab=github`  
:x: `parent/ABC?tab=true`  

## Ranking

If there are more than 1 routes that pass the rules then we sort the results by the following.

1. **Route Depth:** prioritize routes that are more deeply nested
1. **Optional Params:** prioritize routes that match the greater number of optional path and query params
1. **Matching Host:** prioritize routes that match have a static host that matches the URL host.
1. **Matching Hash:** prioritize routes that match have a static hash that matches the URL hash.
