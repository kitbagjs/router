# RouteMeta

Represents additional metadata associated with a route.

## Extends

`Record<string, unknown>`

## Example

Override this interface with declaration merging

```ts
declare module '@kitbag/router' {
  interface RouteMeta {
    pageTitle?: string
  }
}
```
