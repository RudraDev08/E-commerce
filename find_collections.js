import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';

async function findModels() {
    const modelsDir = './Backend/models';
    const findFiles = (dir) => {
        let results = [];
        const list = fs.readdirSync(dir);
        list.forEach(file => {
            file = path.join(dir, file);
            const stat = fs.statSync(file);
            if (stat && stat.isDirectory()) {
                results = results.concat(findFiles(file));
            } else if (file.endsWith('.js')) {
                results.push(file);
            }
        });
        return results;
    };

    const files = findFiles(modelsDir);
    console.log(`Found ${files.length} model files.`);

    for (const file of files) {
        try {
            const content = fs.readFileSync(file, 'utf8');
            const collectionMatch = content.match(/collection:\s*['"](.+?)['"]/);
            const modelMatch = content.match(/mongoose\.model\(['"](.+?)['"]/);

            if (collectionMatch || modelMatch) {
                console.log(`File: ${file}`);
                if (modelMatch) console.log(`  Model: ${modelMatch[1]}`);
                if (collectionMatch) console.log(`  Collection: ${collectionMatch[1]}`);
                else if (modelMatch) console.log(`  Collection (Default): ${modelMatch[1].toLowerCase()}s`);
            }
        } catch (err) {
            // console.error(`Error reading ${file}: ${err.message}`);
        }
    }
    process.exit(0);
}

findModels();
