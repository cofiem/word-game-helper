import fs from "node:fs/promises";
import * as path from "path";

function normaliseWord(word) {
    return word.normalize("NFKD").toLowerCase()
}

/**
 * Find files in a directory.
 * @param dirPath The directory.
 */
async function findFiles(dirPath) {
    const exclude = [
        'abbreviations',
        'roman-numerals',
        'hacker',
        '.95',
    ];
    try {
        const foundFiles = [];

        const files = await fs.readdir(dirPath);
        for (const file of files) {
            const fullFile = path.join(dirPath, file);
            const fileStat = await fs.lstat(fullFile);
            const isFile = fileStat.isFile();
            if (!isFile) {
                continue;
            }

            const isExcluded = exclude.some((value) => {
                return file.includes(value)
            });
            if (isExcluded) {
                continue;
            }
            foundFiles.push(fullFile);
        }
        return foundFiles;
    } catch (err) {
        console.error(err);
    }
}

/**
 * Read file content and process it using a function.
 * @param filePath Path to file.
 */
async function readFile(filePath) {
    try {
        return fs.readFile(filePath, {encoding: 'utf8'});
    } catch (err) {
        console.error(err.message);
    }
}

/**
 * Generate the word data file.
 * @param sourcePaths The source directories containing the raw files.
 */
async function generateWordData(sourcePaths) {
    const results = new Set();
    for (const sourcePath of sourcePaths) {
        const filePaths = await findFiles(sourcePath);
        for (const filePath of filePaths) {
            const fileContent = await readFile(filePath);
            const words = fileContent.split(/\r?\n/);
            for (const word of words) {
                results.add(word);
            }
        }
    }
    return results;
}

/**
 * Create the data file that contains words with at least five-letters.
 * @param sourcePaths The source directories.
 * @param destPath The destination file.
 */
async function createAtLeastFiveWordData(sourcePaths, destPath) {
    const results = new Set();

    const words = await generateWordData(sourcePaths);
    for (const word of words) {
        // get the words, in 'Compatibility Decomposition' form and lower case
        let norm = normaliseWord(word);
        if (norm.endsWith("'s")){
            norm = norm.substring(0, norm.length - 2);
        }
        const azOnly = norm.replace(/[^a-z]/gi, '');
        if (azOnly.length >= 5) {
            results.add(azOnly);
        }
    }

    const content = JSON.stringify(Array.from(results).sort());
    await fs.writeFile(destPath, content);
}

// generate the data file
const sourcePaths = process.env.npm_package_config_sources.split(';').filter((value) => !!value);
const destPath = process.env.npm_package_config_typeShiftData;
console.log(sourcePaths);
await createAtLeastFiveWordData(sourcePaths, destPath);
