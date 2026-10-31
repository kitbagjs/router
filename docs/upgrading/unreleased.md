# Unreleased

These changes are on main after 0.32.0. They do not have a released version yet. The deprecated properties below remain supported; their removal is not part of these changes.

## Deprecations

### Callback data and parent props

Use `route.getData`, `parent.getData`, and `parent.getProps` instead of reading callback `route.data`, `parent.data`, or `parent.props`. Each getter returns a promise. Pass a name for a named loader or view; omit it for the default.

```ts
// Before
const user = await route.data
const session = await parent.data.session
const props = await parent.props

// After
const user = await route.getData()
const session = await parent.getData('session')
const props = await parent.getProps()
```

For a named parent view, replace `await parent.props.sidebar` with `await parent.getProps('sidebar')`.

Components should continue using `useLoader`, following the [0.31.0 migration](/upgrading/0.31.0#component-loader-data). See [Loaders](/core-concepts/loaders) and [Parent Props](/core-concepts/component-props#parent-props) for current callback usage.

## Breaking changes

### Duplicate loader names are rejected by types

Loader names must be unique across a route and its ancestors. Type checking now rejects duplicates that previously passed compilation but failed at runtime. Give each loader a distinct name, including when a parent already has an unnamed loader (whose name is `default`).

See [Named loaders](/core-concepts/loaders#named-loaders).

[Changes since 0.32.0](https://github.com/kitbagjs/router/compare/v0.32.0...main).
