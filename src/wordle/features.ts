import type {Word, Words} from "../common/features.ts";

const logPrefix = '[Word Game Helper]';

const attemptOutcomePresent = '+' as const;
const attemptOutcomeAbsent = '-' as const;
const attemptOutcomeOtherPosition = '?' as const;

const indexAny = 'any' as const;

const groupPresent = 'present' as const;
const groupAbsent = 'absent' as const;
const groupKeys = [groupPresent, groupAbsent];

const filterKeysNumbers = [0, 1, 2, 3, 4];
const filterKeysNumberStrings = filterKeysNumbers.map(i => i.toString());
const filterKeysArray = [indexAny, '0', '1', '2', '3', '4'];
const filterKeys = [indexAny, '0', '1', '2', '3', '4'] as const;

type GroupKeys = typeof groupKeys[number];
type GroupEntry = { [key in GroupKeys]: string; }

type FilterKeys = typeof filterKeys[number];
type FilterEntry = { [key in FilterKeys]: GroupEntry };

type AttemptFilter = { 'symbol': string, 'letter': string }

export interface Attempt {
    filter: AttemptFilter[] | null,
    raw: string | null,
    error: string | null,
    match: string[] | null,
}

export function isFilterKey(value: string): value is FilterKeys {
    return filterKeysArray.includes(value);
}

/**
 * Parse the attempt (answer and outcome using special pattern) and build the information object.
 * @param value The attempted answer and outcome.
 */
export function buildAttempt(value?: Word | null): Attempt {
    value = value ? value : "";

    if (!value) {
        const result = {
            'raw': value,
            'filter': null,
            'error': null,
            'match': null,
        }
        console.info(`${logPrefix} Valid empty attempt.`, result);
        return result;
    }

    const re = /[a-z][\-+?]/gi;
    const charSymbols = value.toLowerCase().match(re);
    if (!charSymbols) {
        const result = {
            'raw': value,
            'filter': null,
            'error': "Invalid format.",
            'match': charSymbols,
        }
        console.warn(`${logPrefix} Invalid attempt.`, result);
        return result;
    }
    if (charSymbols.length !== 5) {
        const result = {
            'raw': value,
            'filter': null,
            'error': "Must be 10 characters: 5 letters and 5 symbols.",
            'match': charSymbols,
        }
        console.warn(`${logPrefix} Invalid attempt.`, result);
        return result;
    }

    const filter = charSymbols.map((item) => {
        return {'letter': item[0], 'symbol': item[1]}
    })
    const result = {
        'raw': value,
        'filter': filter,
        'error': null,
        'match': charSymbols,
    }
    console.info(`${logPrefix} Valid attempt.`, result);
    return result;
}

export function emptyFilter() {
    const keyAny = indexAny;
    const p = groupPresent;
    const a = groupAbsent;
    return {
        [keyAny]: {[p]: '', [a]: ''},
        '0': {[p]: '', [a]: ''},
        '1': {[p]: '', [a]: ''},
        '2': {[p]: '', [a]: ''},
        '3': {[p]: '', [a]: ''},
        '4': {[p]: '', [a]: ''},
    };
}

/**
 * Build the word filter using the attempt information.
 * @param  attempts The array of attempt information.
 * @return {}
 */
export function buildFilter(attempts?: Attempt[] | null): FilterEntry | null {
    let isValid = true;
    attempts = attempts ? attempts : [];
    const filter = emptyFilter();

    // populate the individual indexes first
    (attempts || []).forEach((attempt) => {
        if (!attempt || attempt.error) {
            isValid = false;
            console.warn(`${logPrefix} Can't build filter due to invalid attempt.`, attempt);
        }
        (attempt.filter || []).forEach((filterItem, filterItemIndex) => {
            if (!isValid || filterItem == null) {
                return;
            }
            const index = filterItemIndex.toString();
            if (!isFilterKey(index)) {
                return;
            }
            const letter = filterItem.letter;
            const symbol = filterItem.symbol;
            if (symbol === attemptOutcomePresent) {
                // +: must be at that index, can't say either way about other indexes
                addLetter(filter, index, groupPresent, letter);

            } else if (symbol === attemptOutcomeOtherPosition) {
                // ?: cannot be at that index
                addLetter(filter, index, groupAbsent, letter);

            } else if (symbol === attemptOutcomeAbsent) {
                // -: cannot be at that index
                addLetter(filter, index, groupAbsent, letter);
            }
        });
    });

    // just stop and return if the filter is not valid
    if (!isValid) {
        console.warn(`${logPrefix} Not building filter due to invalid attempt.`);
        return null;
    }

    // then make deductions about the overall presence or absence of letters
    (attempts || []).forEach((attempt) => {
        (attempt.filter || []).forEach((filterItem) => {
            const letter = filterItem.letter;
            const symbol = filterItem.symbol;

            if (symbol === attemptOutcomeOtherPosition) {
                // must be at least one of the other indexes
                addLetter(filter, indexAny, groupPresent, letter);

            } else if (symbol === attemptOutcomeAbsent) {
                // for each index, if letter is not already 'present', then the letter can't be present
                let foundLetterPresent = false;
                filterKeysNumberStrings.forEach((key) => {
                    if (isFilterKey(key)) {
                        if (!filter[key].present.includes(letter)) {
                            addLetter(filter, key, groupAbsent, letter);
                        } else {
                            foundLetterPresent = true;
                        }
                    }
                });

                // if the letter is not already present at any index, then it cannot be present at any index
                if (!foundLetterPresent) {
                    addLetter(filter, indexAny, 'absent', letter);
                }
            }
        });
    });

    console.info(`${logPrefix} Built filter.`, filter);

    return filter;

}

/**
 * Add a letter to the container in the index and group.
 * @param container The container.
 * @param index The index.
 * @param name The group name.
 * @param {string} letter The letter to add.
 */
export function addLetter(container: FilterEntry, index: FilterKeys, name: GroupKeys, letter: string) {
    const validContainer = container !== null && container !== undefined;
    const validIndex = [indexAny, '0', '1', '2', '3', '4', 0, 1, 2, 3, 4].includes(index);
    const validName = [groupPresent, groupAbsent].includes(name);
    const validLetter = 'abcdefghijklmnopqrstuvwxyz'.includes(letter);
    if (!validContainer || !validIndex || !validName || !validLetter) {
        console.error(`${logPrefix} Must provide values for all arguments to addLetter. container ${container}, index ${index}, name ${name}, letter ${letter}.`);
        return;
    }

    const current = container[index][name];

    if (name === groupPresent && index !== indexAny && current === letter) {
        // don't add the same letter more than once
        return;
    }

    if (name === groupPresent && index !== indexAny && current) {
        console.warn(`${logPrefix} Unexpected more than one letter for present at an index. Existing ${current}, new ${letter}.`);
        return;
    }

    if (!current.includes(letter)) {
        container[index][name] += letter;
    }
}

/**
 * Keep only the words that match the filter.
 * @param words All possible words.
 * @param filter Return only words that match this filter.
 * @return The words that match the filter.
 */
export function filterWords(words?: Words | null, filter?: FilterEntry | null): Words | null {
    if (!filter) {
        console.warn(`${logPrefix} No filter.`);
        return null;
    }
    let result = (words || []).filter((word) => {
        // word must contain the 'any' 'present' letters
        const anyPresent = Array.from(filter.any.present)
        for (const char of anyPresent) {
            if (anyPresent.length > 0 && !word.includes(char)) {
                return false;
            }
        }

        // word must not contain the 'any' 'absent' letters
        const anyAbsent = Array.from(filter.any.absent)
        for (const char of anyAbsent) {
            if (anyAbsent.length > 0 && word.includes(char)) {
                return false;
            }
        }

        // check the known char at index
        const wordArray = Array.from(word);
        for (let index = 0; index < wordArray.length; index++) {
            const char = wordArray[index];
            const indexString = index.toString();
            if (!isFilterKey(indexString)) {
                return false;
            }
            if (filter[indexString].absent.length > 0 && filter[indexString].absent.includes(char)) {
                // word must not contain absent char in index
                return false;
            }
            if (filter[indexString].present.length > 0 && !filter[indexString].present.includes(char)) {
                // word must contain present char at index
                return false;
            }
        }

        return true;
    });

    result = orderRemaining(result, filter);

    console.info(`${logPrefix} Filter matched ${result.length} words.`, filter);
    return result;
}

export function wordsFromAttempts(attempts: Words, words: Words) {
    const builtAttempts = (attempts || []).map((attempt) => buildAttempt(attempt));
    const builtFilter = buildFilter(builtAttempts);
    if (builtFilter !== null) {
        return filterWords(words, builtFilter);
    }
}

/**
 * Order words according to the value (likelihood, usefulness) of the word as a next guess.
 *
 * @param words The words that match the filter.
 * @param filter Return only words that match this filter.
 * @return Re-ordered words.
 */
export function orderRemaining(words: Words, filter: FilterEntry) {
    // value / most likely / most useful is defined as:
    // - contains more, and different, not-yet-guessed letters
    // - contains more common letters [done]
    // - contains letters that exclude the most remaining options [done]

    // Options for ordering:
    // words = orderRandom(words);
    // orderLetterFrequency(words);
    orderExcludeCount(words, filter);

    return words;
}

/**
 * Order the words in a random order.
 * @param words  The possible words.
 * @return The ordered words.
 */
export function orderRandom(words: Words): Words {
    // If there are more than 50 words, choose a random set of words.
    const maxWordsCount = 50;
    const availableWords = words.length;
    const result: Words = [];
    let selectedWord = null;
    do {
        selectedWord = words[Math.floor(Math.random() * availableWords)];
        if (!result.includes(selectedWord)) {
            result.push(selectedWord)
        }
    } while (result.length < maxWordsCount)
    return result;
}

/**
 * Order the words by the letter frequency.
 * @param words The possible words.
 * @return The ordered words.
 */
export function orderLetterFrequency(words: Words): Words {
    // https://en.wikipedia.org/wiki/Letter_frequency
    const lettersFrequency = "etaoinshrdlcumwfgypbvkxjqz"

    // Letter Frequency
    // Assign each letter a value from 26 for the first letter to 1 for the last.
    // The score for a word is the mean of the values.

    const count = lettersFrequency.length;
    const lettersMap = new Map();
    const wordScoreMap = new Map();

    Array.from(lettersFrequency).forEach((value, index) =>
        lettersMap.set(value, count - index)
    );

    const scoreFunction = function (word: Word) {
        let wordScore = 0;
        for (const letter of word) {
            const letterScore = lettersMap.get(letter);
            if (letterScore === undefined) {
                continue;
            }
            wordScore += letterScore;
        }
        return wordScore / word.length;
    };

    const compareFunction = function (a: string, b: string): 0 | 1 | -1 {
        let aValue;
        let bValue;
        if (wordScoreMap.has(a)) {
            aValue = wordScoreMap.get(a);
        } else {
            aValue = scoreFunction(a);
            wordScoreMap.set(a, aValue);
        }
        if (wordScoreMap.has(b)) {
            bValue = wordScoreMap.get(b);
        } else {
            bValue = scoreFunction(b);
            wordScoreMap.set(b, bValue);
        }

        return aValue > bValue ? -1 : (aValue < bValue ? 1 : 0);
    };
    return words.sort(compareFunction);
}

/**
 * Order words with the words that exclude the most words first.
 * @param words  The possible words.
 * @param filter  Return only words that match this filter.
 * @return The ordered words.
 */
export function orderExcludeCount(words: Words, filter: FilterEntry): Words {
    // Words that exclude the most remaining words
    // Assuming that a word has no more included letters ('+' or '?').
    const requiredLetters = filter.any.present;
    const wordsLettersMap = new Map();
    for (const word of words) {
        for (const letter of word) {
            if (requiredLetters.includes(letter)) {
                continue;
            }
            if (!wordsLettersMap.has(letter)) {
                wordsLettersMap.set(letter, []);
            }
            wordsLettersMap.get(letter).push(word);
        }
    }

    const wordsExcludeCountMap = new Map();
    for (const word of words) {
        let excludeCount = 0;
        const letters = new Set(word);
        for (const letter of letters) {
            excludeCount += wordsLettersMap.get(letter)?.length ?? 0;
        }
        wordsExcludeCountMap.set(word, excludeCount);
    }

    const compareFunction = function (a: string, b: string): 0 | 1 | -1 {
        const aValue = wordsExcludeCountMap.get(a) ?? 0;
        const bValue = wordsExcludeCountMap.get(b) ?? 0;
        return aValue > bValue ? -1 : (aValue < bValue ? 1 : 0);
    };

    return words.sort(compareFunction);
}


