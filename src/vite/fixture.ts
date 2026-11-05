import { mkdtemp, mkdir, realpath, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { onTestFinished } from 'vitest'

export async function createFixture(files: Record<string, string>): Promise<string> {
  const root = await realpath(await mkdtemp(join(tmpdir(), 'kitbag-discovery-')))
  onTestFinished(() => rm(root, { recursive: true, force: true }))

  for (const [name, content] of Object.entries(files)) {
    const file = join(root, name)
    await mkdir(dirname(file), { recursive: true })
    await writeFile(file, content)
  }

  return root
}
