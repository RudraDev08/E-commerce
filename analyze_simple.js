// Admin Panel Codebase Analysis Script
const fs = require('fs');
const path = require('path');

function getAllFiles(dir, files = []) {
    const items = fs.readdirSync(dir);
    items.forEach(item => {
        const fullPath = path.join(dir, item);
        try {
            const stat = fs.statSync(fullPath);
            if (stat.isDirectory() && item !== 'node_modules' && item !== '.git' && item !== 'dist') {
                getAllFiles(fullPath, files);
            } else if (item.endsWith('.jsx') || item.endsWith('.js')) {
                files.push(fullPath);
            }
        } catch (e) {
            // Skip
        }
    });
    return files;
}

function extractImports(filePath) {
    try {
        const content = fs.readFileSync(filePath, 'utf8');
        const imports = [];
        const lines = content.split('\n');

        lines.forEach(line => {
            if (line.trim().startsWith('import ') && line.includes('from')) {
                const match = line.match(/from\s+['"]([^'"]+)['"]/);
                if (match && (match[1].startsWith('.') || match[1].startsWith('../'))) {
                    imports.push(match[1]);
                }
            }
        });

        return imports;
    } catch (e) {
        return [];
    }
}

const srcDir = path.join(process.cwd(), 'src');
const allFiles = getAllFiles(srcDir);

console.log('\\n' + '='.repeat(100));
console.log(' ADMIN PANEL - COMPLETE CODEBASE ANALYSIS');
console.log('='.repeat(100) + '\\n');

console.log(`Total Files: ${allFiles.length}\\n`);

// Group by directory
const byDir = {};
allFiles.forEach(f => {
    const rel = path.relative(srcDir, f);
    const dir = path.dirname(rel).split(path.sep)[0] || 'root';
    if (!byDir[dir]) byDir[dir] = [];
    byDir[dir].push(rel);
});

console.log('📁 FILES BY DIRECTORY:\\n');
Object.keys(byDir).sort().forEach(dir => {
    console.log(`  ${dir}/ (${byDir[dir].length} files)`);
    byDir[dir].sort().forEach(f => {
        console.log(`    - ${f}`);
    });
    console.log('');
});

// Check imports
console.log('\\n' + '='.repeat(100));
console.log(' IMPORT ANALYSIS');
console.log('='.repeat(100) + '\\n');

const importedFiles = new Set();
allFiles.forEach(file => {
    const imports = extractImports(file);
    imports.forEach(imp => {
        importedFiles.add(imp);
    });
});

console.log(`Files with imports detected: ${importedFiles.size}\\n`);

console.log('\\n' + '='.repeat(100));
console.log(' ANALYSIS COMPLETE');
console.log('='.repeat(100) + '\\n');
