# Register

Represents the state of currently registered router, and rejections.

## router

Used to provide correct type context for
components like `RouterLink`, as well as for composables like `useRouter`, `useRoute`, and hooks.

## rejections

Used to extend the default rejections of ['NotFound'] to include your custom rejections. Note that the default "NotFound" is always an available rejection.

## routeMeta

This type will be used as a default on `meta` when defining your route with `createRoute`.

## Example

```ts
declare module '@kitbag/router' {
  interface Register {
    router: typeof router,
    rejections: ["NotAuthorized"],
    routeMeta: { public?: boolean }
  }
}
```
