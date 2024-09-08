# Register

Represents the state of currently registered router, and rejections.

## router

Used to provide correct type context for
components like `RouterLink`, as well as for composables like `useRouter`, `useRoute`, and hooks.

## routeMeta

This type will be used as a default on `meta` when defining your route with `createRoute`.

## Example

```ts
declare module '@kitbag/router' {
  interface Register {
    router: typeof router,
    routeMeta: { public?: boolean }
  }
}
```
