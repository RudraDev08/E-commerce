
const fs = require('fs');
const path = require('path');

function getFiles(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    for (const file of list) {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        if (stat && stat.isDirectory()) {
            if (file !== 'node_modules' && file !== '.git') {
                results = results.concat(getFiles(filePath));
            }
        } else if (file.endsWith('.js') || file.endsWith('.md')) {
            results.push(filePath);
        }
    }
    return results;
}

const files = getFiles(process.cwd());
const fileMap = {};

for (const file of files) {
    const name = path.basename(file);
    if (!fileMap[name]) {
        fileMap[name] = [];
    }
    fileMap[name].push(file);
}

console.log('--- Duplicate File Names ---');
for (const name in fileMap) {
    if (fileMap[name].length > 1) {
        console.log(`\n${name}:`);
        fileMap[name].forEach(f => console.log(`  - ${f}`));
    }
}
