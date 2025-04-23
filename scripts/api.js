import path from 'path'
import fs from 'fs/promises'

async function renameTypeAliasesFolderToTypes() {
  try {
    const oldPath = path.join(process.cwd(), 'docs', 'api', 'type-aliases')
    const newPath = path.join(process.cwd(), 'docs', 'api', 'types')

    // Check if old directory exists
    await fs.access(oldPath)

    // Rename the directory
    await fs.rename(oldPath, newPath)

    console.log('Successfully renamed type-aliases folder to types')
  }
  catch (error) {
    if (error.code === 'ENOENT') {
      console.error('Error: The type-aliases directory does not exist')
    }
    else {
      console.error('Error renaming folder:', error)
    }
    process.exit(1)
  }
}

async function updateReferences(searchString, replaceString) {
  try {
    const apiDir = path.join(process.cwd(), 'docs', 'api')
    const entries = await fs.readdir(apiDir, { withFileTypes: true, recursive: true })

    for (const entry of entries) {
      if (entry.isFile() && (entry.name.endsWith('.md') || entry.name.endsWith('.json'))) {
        const fullPath = path.join(entry.path || '', entry.name)
        const content = await fs.readFile(fullPath, 'utf8')
        const updatedContent = content.replace(new RegExp(searchString, 'g'), replaceString)

        if (content !== updatedContent) {
          await fs.writeFile(fullPath, updatedContent, 'utf8')
          console.log(`Updated references in: ${fullPath}`)
        }
      }
    }
    console.log(`Successfully updated all references from ${searchString} to ${replaceString}`)
  }
  catch (error) {
    console.error('Error updating references:', error)
    throw error
  }
}

async function organizeFilesByGroup() {
  try {
    const apiDir = path.join(process.cwd(), 'docs', 'api')
    const entries = await fs.readdir(apiDir, { withFileTypes: true, recursive: true })
    const changes = new Map() // Track old paths to new paths

    // First pass: collect all the moves we need to make
    for (const entry of entries) {
      if (entry.isFile() && entry.name.endsWith('.md')) {
        const fullPath = path.join(entry.path || '', entry.name)
        const content = await fs.readFile(fullPath, 'utf8')

        // Extract group from H1 heading
        const match = content.match(/^# ([^:]+):/m)
        if (match) {
          const group = match[1].trim()
          const folderName = group.toLowerCase().replace(/\s+/g, '-')
          const targetDir = path.join(apiDir, folderName)

          // Create directory if it doesn't exist
          try {
            await fs.access(targetDir)
          }
          catch {
            await fs.mkdir(targetDir)
            console.log(`Created new directory: ${targetDir}`)
          }

          // Check if file needs to be moved
          const currentDir = path.dirname(fullPath)
          if (currentDir !== targetDir) {
            const oldPath = path.relative(apiDir, fullPath)
            const newPath = path.join(folderName, entry.name)
            changes.set(oldPath, newPath)
          }
        }
      }
    }

    // Second pass: perform the moves
    for (const [oldPath, newPath] of changes) {
      const sourcePath = path.join(apiDir, oldPath)
      const targetPath = path.join(apiDir, newPath)
      await fs.rename(sourcePath, targetPath)
      console.log(`Moved ${oldPath} to ${newPath}`)
    }

    // Third pass: update all references for each move
    for (const [oldPath, newPath] of changes) {
      await updateReferences(oldPath, newPath)
    }

    console.log('Successfully organized files by their groups and updated all references')
  }
  catch (error) {
    console.error('Error organizing files:', error)
    throw error
  }
}

await renameTypeAliasesFolderToTypes()
await updateReferences('type-aliases', 'types')
await updateReferences('Type Aliases', 'Types')
await organizeFilesByGroup()
