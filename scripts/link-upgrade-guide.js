import { execFileSync } from 'node:child_process'
import { existsSync, readdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const directory = fileURLToPath(new URL('../docs/upgrading/', import.meta.url))
const args = process.argv.slice(2)
const dryRun = args.includes('--dry-run')
const all = args.includes('--all')
const tag = args.find(arg => !arg.startsWith('--'))
const repository = process.env.GITHUB_REPOSITORY ?? 'kitbagjs/router'

if (!all && !/^v\d+\.\d+\.\d+$/.test(tag ?? '')) {
  throw new Error('Usage: node scripts/link-upgrade-guide.js <tag> | --all [--dry-run]')
}

const releases = all
  ? JSON.parse(execFileSync('gh', [
    'api', `repos/${repository}/releases?per_page=100`, '--paginate', '--slurp',
  ], { encoding: 'utf8' })).flat()
  : null

const tags = all
  ? readdirSync(directory)
    .filter(file => /^\d+\.\d+\.\d+\.md$/.test(file))
    .map(file => `v${file.slice(0, -3)}`)
  : [tag]

for (const releaseTag of tags) {
  const version = releaseTag.slice(1)
  if (!existsSync(`${directory}${version}.md`)) {
    continue
  }

  const result = releases
    ? releases.find(release => release.tag_name === releaseTag)
    : JSON.parse(execFileSync('gh', [
      'api', `repos/${repository}/releases/tags/${releaseTag}`,
    ], { encoding: 'utf8' }))
  if (!result) {
    console.error(`No GitHub release for ${releaseTag}; skipping backlink.`)
    continue
  }
  const url = `https://kitbag-router.netlify.app/upgrading/${version}`
  if (result.body?.includes(url)) {
    continue
  }

  const body = `## Upgrading\n\nSee the [${version} upgrade guide](${url}) for breaking changes and deprecations.\n\n${result.body ?? ''}`
  if (dryRun) {
    console.log(JSON.stringify({ tag: releaseTag, url, body }))
    continue
  }

  execFileSync('gh', [
    'api', '--method', 'PATCH', `repos/${repository}/releases/${result.id}`, '--input', '-',
  ], {
    input: JSON.stringify({ body }),
    stdio: ['pipe', 'ignore', 'inherit'],
  })
}
