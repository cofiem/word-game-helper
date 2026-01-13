import type {Letters, Words} from "../common/features.ts";

export interface FoundLetter {
    row: number,
    col: number,
    value: string,
}

/**
 *
 * @param foundWords
 * @param enteredLetters
 * @param allWords
 */
export function possibleWords(foundWords: Words, enteredLetters: Letters, allWords: Words){
    return foundWords.map(foundWord => {
        const missingLetters = enteredLetters.filter(enteredLetter => !foundWord.includes(enteredLetter));
        const filteredWords = allWords.filter((word) => {
            if (missingLetters.some(missingLetter => word.includes(missingLetter))) {
                // Word cannot contain letter that has been entered, but is not found in the word.
                return false;
            }
            for (let availableIndex = 0; availableIndex < Array.from(word).length; availableIndex++) {
                const availableLetter = Array.from(word)[availableIndex];
                const foundLetter = foundWord[availableIndex];
                if (!availableLetter || availableLetter === " " || !foundLetter || foundLetter === " " || availableLetter === foundLetter) {
                    // Keep the word if the letter at this index is empty or space,
                    // or the available and found letters match.
                    continue;
                }
                // Otherwise reject the word.
                return false;
            }
            // Keep the word if every letter is ok.
            return true;
        });
        const orderedLetters = orderLettersExcludeCount(filteredWords, enteredLetters);
        return {
            filteredWords: filteredWords,
            orderedLetters: orderedLetters,
            foundLetterCount: Array.from(foundWord).filter(i => i !== " ").length,
        };
    });
}

/**
 * Extract letters from the provided words, and order the letters,
 * so that the letters that exclude the most words are first.
 * @param words The possible words.
 * @param excludeLetters The letters to exclude.
 * @return The ordered letters.
 */
export function orderLettersExcludeCount(words: Words, excludeLetters: Letters): Letters {
    const letterWordsMap = new Map<string, Set<string>>();
    for (const word of words) {
        for (const letter of word) {
            if (excludeLetters.includes(letter)){
                continue;
            }
            if (!letterWordsMap.has(letter)) {
                letterWordsMap.set(letter, new Set<string>());
            }
            letterWordsMap.get(letter)?.add(word);
        }
    }

    const compareFunction = function (a: string, b: string): 0 | 1 | -1 {
        const aValue = letterWordsMap.get(a) ?? 0;
        const bValue = letterWordsMap.get(b) ?? 0;
        return aValue > bValue ? -1 : (aValue < bValue ? 1 : 0);
    };

    return Array.from(letterWordsMap.keys()).sort(compareFunction);
}