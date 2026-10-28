import { readFile, rm, stat, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { expect, test } from 'vitest'
import { createFixture } from './fixture'
import { createRouteGenerator } from './generateRoutes'

const route = (name: string): string => `import { createRoute } from '@kitbag/router'; export const ${name} = createRoute({ name: '${name}' })`

test('discovers both suffixes, only collects exports, and excludes plain names and generated files', async () => {
  const root = await createFixture({
    'src/home.route.ts': route('home') + '; const privateRoute = createRoute({ name: \'private\' })',
    'src/account.routes.ts': route('account'),
    'src/route.ts': route('ignored'),
    'src/routes.ts': route('ignoredToo'),
    'src/test.spec.route.ts': route('test'),
    'src/home.route.generated.ts': 'old output',
  })
  const generator = createRouteGenerator({ root })
  const result = await generator.generate()
  const output = await readFile(join(root, 'src/routes.generated.ts'), 'utf8')
  expect(output).toContain('import { account }')
  expect(output).toContain('import { home }')
  expect(output).not.toMatch(/ignored|privateRoute|test as/)
  expect(result.files).toHaveLength(3)
  const before = await stat(join(root, 'src/home.route.generated.ts'))
  expect((await generator.generate()).changed).toBe(false)
  expect((await stat(join(root, 'src/home.route.generated.ts'))).mtimeMs).toBe(before.mtimeMs)
})

test('supports explicit registries without an aggregate and preserves repeated entries', async () => {
  const root = await createFixture({
    'src/home.ts': route('home'),
    'src/routes.ts': 'import { home } from \'./home\'; export const routes = [home, home] as const',
  })
  await createRouteGenerator({ root, routes: ['src/routes.ts'], output: false }).generate()
  const output = await readFile(join(root, 'src/routes.generated.ts'), 'utf8')
  expect(output).toContain('"./home.generated"')
  expect(output).toContain('[home, home] as const')
})

test('cleans stale owned output after a source is deleted, including after restarting generation', async () => {
  const root = await createFixture({
    'src/home.route.ts': route('home'),
    'src/other.generated.ts': '// owned by another tool',
  })
  await createRouteGenerator({ root }).generate()
  await rm(join(root, 'src/home.route.ts'))
  await createRouteGenerator({ root }).generate()
  await expect(stat(join(root, 'src/home.route.generated.ts'))).rejects.toThrow()
  expect(await readFile(join(root, 'src/other.generated.ts'), 'utf8')).toBe('// owned by another tool')
  expect(await readFile(join(root, 'src/routes.generated.ts'), 'utf8')).toContain('routes = [] as const')
})

test('keeps the previous complete output when parsing fails and recovers on the next generation', async () => {
  const root = await createFixture({ 'src/home.route.ts': route('home') })
  const generator = createRouteGenerator({ root })
  await generator.generate()
  const output = await readFile(join(root, 'src/home.route.generated.ts'), 'utf8')
  await writeFile(join(root, 'src/home.route.ts'), 'export const home = (')
  await expect(generator.generate()).rejects.toThrow('Cannot parse')
  expect(await readFile(join(root, 'src/home.route.generated.ts'), 'utf8')).toBe(output)
  await writeFile(join(root, 'src/home.route.ts'), route('updated'))
  await generator.generate()
  expect(await readFile(join(root, 'src/routes.generated.ts'), 'utf8')).toContain('import { updated }')
})

test('reports an aggregate/counterpart collision before writing any output', async () => {
  const root = await createFixture({ 'src/routes.ts': route('home') })
  await expect(createRouteGenerator({ root, routes: ['src/routes.ts'] }).generate()).rejects.toThrow('aggregate conflicts')
  await expect(stat(join(root, 'src/routes.generated.ts'))).rejects.toThrow()
  await createRouteGenerator({ root, routes: ['src/routes.ts'], output: 'src/all.generated.ts' }).generate()
  expect(await readFile(join(root, 'src/all.generated.ts'), 'utf8')).toContain('"./routes.generated"')
})

test('allows a build to generate while the development server is running', async () => {
  const root = await createFixture({ 'src/home.route.ts': route('home') })
  const development = createRouteGenerator({ root })
  const build = createRouteGenerator({ root })
  await Promise.all([development.generate(), build.generate()])
  expect(await readFile(join(root, 'src/routes.generated.ts'), 'utf8')).toContain('import { home }')
  expect(await readFile(join(root, 'src/home.route.generated.ts'), 'utf8')).toContain("name: 'home'")
})

test('discovers routes outside src and replaces default discovery with explicit patterns', async () => {
  const root = await createFixture({
    'pages/home.route.ts': route('home'),
    'pages/account.routes.ts': route('account'),
    'src/registry.ts': route('explicit'),
  })
  await createRouteGenerator({ root }).generate()
  const discovered = await readFile(join(root, 'src/routes.generated.ts'), 'utf8')
  expect(discovered).toContain('import { home }')
  expect(discovered).toContain('import { account }')
  expect(discovered).not.toContain('import { explicit }')

  await createRouteGenerator({ root, routes: ['src/registry.ts'] }).generate()
  const explicit = await readFile(join(root, 'src/routes.generated.ts'), 'utf8')
  expect(explicit).toContain('import { explicit }')
  expect(explicit).not.toMatch(/import \{ home \}|import \{ account \}/)

  await createRouteGenerator({ root, routes: [] }).generate()
  expect(await readFile(join(root, 'src/routes.generated.ts'), 'utf8')).toContain('routes = [] as const')
})

test('aliases conflicting route exports and preserves repeated registrations', async () => {
  const root = await createFixture({
    'src/first.route.ts': route('home'),
    'src/second.route.ts': route('home'),
  })
  await createRouteGenerator({ root, routes: ['src/first.route.ts', 'src/second.route.ts', 'src/first.route.ts'] }).generate()
  const output = await readFile(join(root, 'src/routes.generated.ts'), 'utf8')
  expect(output).toContain('import { home as home_1 } from "./first.route.generated"')
  expect(output).toContain('import { home as home_2 } from "./second.route.generated"')
  expect(output).toContain('routes = [\n  home_1,\n  home_2,\n  home_1,\n] as const')
})
