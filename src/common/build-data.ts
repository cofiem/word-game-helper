import {lstat, readdir, readFile, writeFile} from "node:fs/promises";
import {normaliseWord} from "./features.ts";
import {join} from "node:path";

/**
 * Find files in a directory.
 * @param dirPath The directory.
 * @param exclude The partial files names to exclude.
 */
async function findFiles(dirPath: string, exclude: string[]) {
    try {
        const foundFiles = [];

        const files = await readdir(dirPath);
        for (const file of files) {
            const fullFile = join(dirPath, file);
            const fileStat = await lstat(fullFile);
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
async function readDataFile(filePath: string) {
    try {
        return readFile(filePath, {encoding: 'utf8'});
    } catch (err) {
        console.error(`Could not read file`, err);
    }
}


/**
 * Generate the word data file.
 * @param sourcePaths The source directories containing the raw files.
 * @param exclude The partial files names to exclude.
 */
async function generateWordData(sourcePaths: string[], exclude: string[]) {
    const results = new Set<string>();
    for (const sourcePath of sourcePaths) {
        const filePaths = await findFiles(sourcePath, exclude) ?? [];
        for (const filePath of filePaths) {
            const fileContent = await readDataFile(filePath) ?? "";
            const words = fileContent?.split(/\r?\n/);
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
 * @param exclude The partial files names to exclude.
 * @param minLength The minimum word length.
 * @param maxLength The maximum word length.
 */
export async function createWordData(sourcePaths: string[], destPath: string, exclude: string[], minLength: number, maxLength?: number) {
    const results = new Set();

    const words = await generateWordData(sourcePaths, exclude);
    for (const word of words) {
        // get the words, in 'Compatibility Decomposition' form and lower case
        let norm = normaliseWord(word);
        if (norm.endsWith("'s")) {
            norm = norm.substring(0, norm.length - 2);
        }
        const azOnly = norm.replace(/[^a-z]/gi, '');
        if (azOnly.length >= minLength && (maxLength === undefined ? true : azOnly.length <= maxLength)) {
            results.add(azOnly);
        }
    }

    const content = JSON.stringify(Array.from(results).sort());
    await writeFile(destPath, content);

    console.info(`Generated word data from ${sourcePaths} to ${destPath}`);
}
