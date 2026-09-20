// the package's own declarations are not a module, so the two functions the tests use are declared here
declare module 'view-transitions-mock' {
  export function register(options?: { requireTypes?: boolean, forced?: boolean }): void
  export function unregister(): void
}
