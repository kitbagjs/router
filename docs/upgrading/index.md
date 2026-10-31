# Upgrading

Each guide covers the breaking changes and deprecations introduced by that release. Releases without a migration are omitted, including ordinary feature and bug-fix releases.

If you skip versions, follow the applicable guides in release order, from your installed version toward your target version. Examples show the API for the release named on the page; later guides may replace that syntax again. The core and advanced guides describe the current API.

This timeline covers released tags through **0.32.0**. See the [full release history](https://github.com/kitbagjs/router/releases) for features and fixes that do not need migration. Older GitHub release notes sometimes group several tags; these guides assign changes to the first tag that contains them.

[Unreleased changes](/upgrading/unreleased) are on main but have no released version yet.

## Releases

- [0.32.0](/upgrading/0.32.0) — Chainable route hooks and renamed param input types.
- [0.31.0](/upgrading/0.31.0) — Use useLoader in components; remove RouteLoader.
- [0.28.0](/upgrading/0.28.0) — Remove legacy view options.
- [0.27.0](/upgrading/0.27.0) — Validate reachable paths and require link destinations.
- [0.26.0](/upgrading/0.26.0) — Title getter and narrower hook context.
- [0.25.0](/upgrading/0.25.0) — Deprecate view options and simplify route types.
- [0.24.2](/upgrading/0.24.2) — Remove exported hook and route implementation helpers.
- [0.24.0](/upgrading/0.24.0) — Hide internal route, URL, and plugin types.
- [0.22.6](/upgrading/0.22.6) — Trailing slashes no longer distinguish routes by default.
- [0.22.1](/upgrading/0.22.1) — Explicit greedy params and route URL methods.
- [0.22.0](/upgrading/0.22.0) — Rename URL string types.
- [0.21.0](/upgrading/0.21.0) — Remove deprecated hook options, URL helpers, and types.
- [0.20.11](/upgrading/0.20.11) — Zod 4, rejection definitions, callback context, and plugin hooks.
- [0.20.8](/upgrading/0.20.8) — Deprecate hook options and registered helper types.
- [0.20.7](/upgrading/0.20.7) — Infer registered route and hook registration types.
- [0.19.0](/upgrading/0.19.0) — Param collection helpers accept an array.
- [0.17.3](/upgrading/0.17.3) — Deprecate path, query, and host helpers.
- [0.16.0](/upgrading/0.16.0) — Move props to the second createRoute argument.
- [0.15.3](/upgrading/0.15.3) — Remove the component onAfterRouteEnter hook.
- [0.15.1](/upgrading/0.15.1) — Infer rejection method types from the router.
- [0.14.1](/upgrading/0.14.1) — Separate name resolution from URL lookup.
- [0.14.0](/upgrading/0.14.0) — Resolve returns a route instead of a URL.
- [0.13.3](/upgrading/0.13.3) — Lazy prefetching by default and props context correction.
- [0.13.0](/upgrading/0.13.0) — Props callbacks receive the resolved route.
- [0.12.0](/upgrading/0.12.0) — Vue 3.5 requirement and hook helper types.
- [0.11.2](/upgrading/0.11.2) — Rejection matches no longer use the rejection type as a route name.
- [0.11.0](/upgrading/0.11.0) — Start the router explicitly outside app installation.
- [0.10.0](/upgrading/0.10.0) — URL part objects use value.
- [0.8.1](/upgrading/0.8.1) — Infer rejection types from router options.
- [0.7.2](/upgrading/0.7.2) — Route names replace generated keys.
- [0.7.1](/upgrading/0.7.1) — Read combined meta and infer match record types.
- [0.7.0](/upgrading/0.7.0) — Remove disabled routes and register meta through Register.
- [0.6.0](/upgrading/0.6.0) — Individual route factories and parent references.
- [0.5.0](/upgrading/0.5.0) — Narrow the current route and update useRoute option types.
- [0.2.0](/upgrading/0.2.0) — Bracket syntax for params.
- [0.1.1](/upgrading/0.1.1) — Wrap lazy components with defineAsyncComponent.
