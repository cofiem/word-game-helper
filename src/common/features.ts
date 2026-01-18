const logPrefix = '[Word Game Helper]';


export type Word = string;
export type Letter = string;
export type Words = string[];
export type Letters = string[];

/**
 * Filter the words using the value.
 * @param words All possible words.
 * @param filter The regular expression to filter the words.
 * @return The words that match the filter.
 */
export function filterWords(words: Words, filter: RegExp): Words | null {
    if (!words) {
        console.warn(`${logPrefix} No words.`);
        return null;
    }
    if (!filter) {
        console.warn(`${logPrefix} No filter.`);
        return null;
    }

    const result = words.filter((word) => filter.test(word)) || [];

    // sort in order from longest to shortest
    result.sort((a, b) => {
        if (a.length === b.length) {
            return 0;
        } else if (a.length > b.length) {
            return -1;
        } else {
            return 1;
        }
    })

    return result;
}

/**
 * Normalise a word.
 * @param word
 */
export function normaliseWord(word: Word): Word {
    return word.normalize("NFKD").toLowerCase()
}
