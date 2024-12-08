import path from 'path';
import fs from 'fs/promises';

async function renameTypeAliasesFolderToTypes() {
    try {
        const oldPath = path.join(process.cwd(), 'docs', 'api', 'type-aliases');
        const newPath = path.join(process.cwd(), 'docs', 'api', 'types');
        
        // Check if old directory exists
        await fs.access(oldPath);
        
        // Rename the directory
        await fs.rename(oldPath, newPath);
        
        console.log('Successfully renamed type-aliases folder to types');
    } catch (error) {
        if (error.code === 'ENOENT') {
            console.error('Error: The type-aliases directory does not exist');
        } else {
            console.error('Error renaming folder:', error);
        }
        process.exit(1);
    }
}

async function updateReferences(searchString, replaceString) {
    try {
        const apiDir = path.join(process.cwd(), 'docs', 'api');
        const entries = await fs.readdir(apiDir, { withFileTypes: true, recursive: true });
        
        for (const entry of entries) {
            if (entry.isFile() && (entry.name.endsWith('.md') || entry.name.endsWith('.json'))) {
                const fullPath = path.join(entry.path || '', entry.name);
                const content = await fs.readFile(fullPath, 'utf8');
                const updatedContent = content.replace(new RegExp(searchString, 'g'), replaceString);
                
                if (content !== updatedContent) {
                    await fs.writeFile(fullPath, updatedContent, 'utf8');
                    console.log(`Updated references in: ${fullPath}`);
                }
            }
        }
        console.log(`Successfully updated all references from ${searchString} to ${replaceString}`);
    } catch (error) {
        console.error('Error updating references:', error);
        throw error;
    }
}

await renameTypeAliasesFolderToTypes();
await updateReferences('type-aliases', 'types');
await updateReferences('Type Aliases', 'Types');