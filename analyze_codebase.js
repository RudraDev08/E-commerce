const fs = require('fs');
const path = require('path');

// Get all JS/JSX files
function getAllFiles(dir, files = [], baseDir = dir) {
    try {
        const items = fs.readdirSync(dir);
        items.forEach(item => {
            const fullPath = path.join(dir, item);
            const stat = fs.statSync(fullPath);

            if (stat.isDirectory() && !item.includes('node_modules') && !item.includes('.git')) {
                getAllFiles(fullPath, files, baseDir);
            } else if (item.endsWith('.jsx') || item.endsWith('.js')) {
                files.push({
                    full: fullPath,
                    relative: path.relative(baseDir, fullPath).replace(/\\/g, '/')
                });
            }
        });
    } catch (err) {
        // Skip inaccessible directories
    }
    return files;
}

// Extract imports from a file
function extractImports(filePath) {
    try {
        const content = fs.readFileSync(filePath, 'utf8');
        const importRegex = /import\s+(?:(?:\{[^}]*\}|\*\s+as\s+\w+|\w+)\s+from\s+)?['"]([^'"]+)['"]/g;
        const imports = [];
        let match;

        while ((match = importRegex.exec(content)) !== null) {
            const importPath = match[1];
            // Only track local imports (not node_modules)
            if (importPath.startsWith('.') || importPath.startsWith('@/')) {
                imports.push(importPath);
            }
        }

        return imports;
    } catch (err) {
        return [];
    }
}

// Resolve import path to actual file
function resolveImport(fromFile, importPath) {
    const fromDir = path.dirname(fromFile);
    let resolved = path.join(fromDir, importPath);

    // Try different extensions
    const extensions = ['', '.js', '.jsx', '/index.js', '/index.jsx'];
    for (const ext of extensions) {
        const testPath = resolved + ext;
        if (fs.existsSync(testPath)) {
            return testPath;
        }
    }

    return null;
}

// Main analysis
const srcDir = path.join(__dirname, 'src');
const allFiles = getAllFiles(srcDir);

console.log('='.repeat(80));
console.log('ADMIN PANEL CODEBASE ANALYSIS');
console.log('='.repeat(80));
console.log(`\nTotal Files Found: ${allFiles.length}\n`);

// Build dependency graph
const usageMap = new Map();
const importMap = new Map();

allFiles.forEach(file => {
    usageMap.set(file.full, []);
    const imports = extractImports(file.full);
    importMap.set(file.full, imports);

    imports.forEach(imp => {
        const resolved = resolveImport(file.full, imp);
        if (resolved) {
            if (!usageMap.has(resolved)) {
                usageMap.set(resolved, []);
            }
            usageMap.get(resolved).push(file.relative);
        }
    });
});

// Categorize files
const unused = [];
const used = [];
const entryPoints = [];

allFiles.forEach(file => {
    const usedBy = usageMap.get(file.full) || [];

    if (file.relative === 'main.jsx' || file.relative === 'app/App.jsx') {
        entryPoints.push(file.relative);
    } else if (usedBy.length === 0) {
        unused.push(file.relative);
    } else {
        used.push({ file: file.relative, usedBy: usedBy.length });
    }
});

// Output results
console.log('📁 FOLDER STRUCTURE:');
console.log('-'.repeat(80));
const folders = new Set();
allFiles.forEach(f => {
    const folder = path.dirname(f.relative);
    if (folder !== '.') folders.add(folder);
});
[...folders].sort().forEach(f => console.log(`  ${f}/`));

console.log('\n\n🎯 ENTRY POINTS:');
console.log('-'.repeat(80));
entryPoints.forEach(f => console.log(`  ✓ ${f}`));

console.log('\n\n✅ USED FILES (' + used.length + '):');
console.log('-'.repeat(80));
used.sort((a, b) => b.usedBy - a.usedBy).slice(0, 30).forEach(f => {
    console.log(`  ${f.file} (used by ${f.usedBy} files)`);
});
if (used.length > 30) {
    console.log(`  ... and ${used.length - 30} more files`);
}

console.log('\n\n❌ UNUSED FILES (' + unused.length + '):');
console.log('-'.repeat(80));
if (unused.length === 0) {
    console.log('  No unused files detected!');
} else {
    unused.sort().forEach(f => console.log(`  ${f}`));
}

console.log('\n\n📊 SUMMARY BY DIRECTORY:');
console.log('-'.repeat(80));
const dirStats = {};
allFiles.forEach(f => {
    const dir = path.dirname(f.relative).split('/')[0];
    if (!dirStats[dir]) dirStats[dir] = { total: 0, unused: 0 };
    dirStats[dir].total++;
    if (unused.includes(f.relative)) dirStats[dir].unused++;
});

Object.entries(dirStats).sort().forEach(([dir, stats]) => {
    const pct = ((stats.unused / stats.total) * 100).toFixed(1);
    console.log(`  ${dir.padEnd(20)} ${stats.total} files, ${stats.unused} unused (${pct}%)`);
});

console.log('\n' + '='.repeat(80));
