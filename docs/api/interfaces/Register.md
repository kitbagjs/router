# Interfaces: Register

Represents the state of currently registered router, and route meta. Used to provide correct type context for
components like `RouterLink`, as well as for composables like `useRouter`, `useRoute`, and hooks.

## Example

```ts
declare module '@kitbag/router' {
  interface Register {
    router: typeof router
    routeMeta: { public?: boolean }
  }
}
```
