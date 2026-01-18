import type {Letters, Word, Words} from "../common/features.ts";

export const logPrefix = '[Word Game Helper]';

export interface FoundLetter {
    row: number | string,
    col: number | string,
    value: string,
}

export interface PossibleWords {
    index: number,
    letters: string[],
    letterFrequency: Record<string, number>,
    found: number,
    words: string[],
}

export interface PossibleOverall {
    letterFreq: Map<string, number>,
    possible: PossibleWords[],
}

/**
 * Get the entered letters.
 * @param letters The entered letters as a string.
 */
export function getEnteredLetters(letters: string) {
    const enteredLetters = Array.from(letters).filter(c => {
        const code = c.charCodeAt(0);
        // alpha ASCII uppercase and lowercase
        return (code > 64 && code < 91) || (code > 96 && code < 123);
    });
    if (enteredLetters.length > 0) {
        console.debug(`${logPrefix} Entered letters are: ${enteredLetters.map(l => l.toUpperCase()).join(' ')}.`);
    } else {
        console.debug(`${logPrefix} No entered letters.`);
    }
    return enteredLetters;
}


/**
 * Get the found words as an array of strings.
 * @param items The raw found words.
 */
export function getFoundWords(items: FoundLetter[]) {
    const foundWords: string[] = [];
    items.forEach(item => {
        const rowIndex = Number(item.row) - 1;
        if (foundWords.length <= rowIndex) {
            foundWords.push("");
        }
        foundWords[rowIndex] += item.value || " ";
    });
    const foundWordCount = foundWords.filter(word => !!word.trim()).length;
    if (foundWordCount > 0) {
        console.debug(`${logPrefix} ${foundWordCount} found word(s): '${foundWords.join("', '")}'.`);
    } else {
        console.debug(`${logPrefix} No found words.`);
    }
    return foundWords;
}

export function letterFrequency(words: Words, excluded: Letters) {
    const result = words.reduce((previous, current) => {
        const letters = new Set<string>(Array.from(current));

        for (const letter of letters) {
            if (excluded.includes(letter)) {
                continue;
            }
            if (!previous.has(letter)) {
                previous.set(letter, 1);
            } else {
                previous.set(letter, (previous.get(letter) ?? 0) + 1);
            }
        }
        return previous;
    }, new Map<string, number>());
    const wordCount = words.length;
    const freq = new Map<string, number>(result.entries().map(([key, value]) => {
        const factor = Math.pow(10, 2);
        return [key, Math.round((value / wordCount) * factor) / factor];
    }));

    if (freq.size > 0) {
        const formatted = letterFreqFormatted(freq).join(', ');
        console.debug(`${logPrefix} Letter frequency for ${wordCount} words: ${formatted}.`);
    } else {
        console.debug(`${logPrefix} No letters to calculate frequency.`);
    }

    return freq;
}

export function letterFreqSorted(letterFrequency: Map<string, number>) {
    return Array.from(letterFrequency.entries())
        .sort(([_a_letter, a_percent], [_b_letter, b_percent]) =>
            a_percent > b_percent ? -1 : (a_percent == b_percent ? 0 : 1)
        )
}

export function letterFreqFormatted(letterFrequency: Map<string, number>) {
    return letterFreqSorted(letterFrequency)
        .map(([letter, percent]) =>
            `${letter.toUpperCase()} ${percent.toLocaleString(undefined, {
                style: 'percent',
                maximumFractionDigits: 0
            })}`);
}

export function possibleWordsItem(foundWord: Word, enteredLetters: Letters, allWords: Words): PossibleWords {
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

    const wordsLetters = letterFrequency(filteredWords, enteredLetters);

    const foundLetters = Array.from(foundWord);
    return {
        index: 0,
        letters: foundLetters,
        found: foundLetters.filter(i => i !== " ").length,
        letterFrequency: Object.fromEntries(wordsLetters),
        words: filteredWords,
    };
}

/**
 *
 * @param foundWords
 * @param enteredLetters
 * @param allWords
 */
export function possibleWords(foundWords: Words, enteredLetters: Letters, allWords: Words): PossibleOverall {
    const allPossibleWords = new Set<string>();
    const result = foundWords
        .map((foundWord, index) => {
            return {
                ...possibleWordsItem(foundWord, enteredLetters, allWords),
                index: index,
            }
        })
        .filter(item => item.found > 0)
        .map(item => {
            item.words.forEach(word => allPossibleWords.add(word));
            console.debug(`${logPrefix} Found word ${item.index + 1} has ${item.words.length} possible words: ${item.words.slice(0, 5)}.`);
            return item;
        });
    const letterFreq = letterFrequency(Array.from(allPossibleWords), enteredLetters);
    console.debug(`${logPrefix} Overall there are ${allPossibleWords.size} possible words: ${Array.from(allPossibleWords).slice(0, 5)}.`);
    return {letterFreq, possible: result};
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
            if (excludeLetters.includes(letter)) {
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

export function buildHint(possible: PossibleOverall, enteredLetters: Letters): string {

    // Check if there is only one possible word for a found word.
    const foundWordKnown = possible.possible.find(p =>
        p.words.length === 1 && p.found < 5
    );

    // Check if any words have 100% chance of a letter being present. If so, return that letter.
    const foundLettersKnown = possible.possible.find(p =>
        Object.entries(p.letterFrequency)
            .find(([_letter, percent]) => percent === 1 && p.found < 5)
    );


    console.debug(`buildHint`, {possible, enteredLetters, foundWordKnown, foundLettersKnown});

    // Get the overall chances of each remaining letter being present, and return the top 3.

    // this.hintTargets.forEach((hintTarget, index) => {
    //     const possibleItem = possible[index];
    //     if (possibleItem.filteredWords.length === 1 && possibleItem.foundLetterCount < 5) {
    //         // show the only available word
    //         hintTarget.textContent = possibleItem.filteredWords[0];
    //     } else if (possibleItem.foundLetterCount <= 0) {
    //         // No letters, show nothing.
    //         hintTarget.textContent = "";
    //     } else if (possibleItem.foundLetterCount >= 5) {
    //         // Word guessed, done.
    //         hintTarget.textContent = "🎉";
    //     } else if (possibleItem.filteredWords.length === 0) {
    //         // No words available.
    //         hintTarget.textContent = "???";
    //     } else {
    //         // Show best 3 letters.
    //         const wordCount = possibleItem.filteredWords.length;
    //         const hintLetters = possibleItem.orderedLetters.slice(0, 3).join(" ");
    //         hintTarget.textContent = `${hintLetters.toUpperCase()} (${wordCount})`;
    //     }
    // })

    if (foundWordKnown) {
        const msg = `Word ${foundWordKnown.index + 1} is ${foundWordKnown.words[0].toUpperCase()}.`;
        console.debug(`${logPrefix} ${msg}`);
        return msg
    }

    if (foundLettersKnown && Object.entries(foundLettersKnown.letterFrequency).length > 0) {
        const foundLetter = Object.entries(foundLettersKnown.letterFrequency)
            .find(([_letter, percent]) => percent === 1) ?? ["", 0];
        return `Word ${foundLettersKnown.index + 1} contains letter ${foundLetter[0].toUpperCase()}.`;
    }

    if (possible.letterFreq.size > 0) {
        const mostFreqLetters = letterFreqFormatted(possible.letterFreq).slice(0, 3).join("', '");
        const msg = `From ${possible.letterFreq.size} letters most likely are '${mostFreqLetters}'.`
        console.debug(`${logPrefix} ${msg}`);
        return msg;
    }

    if (possible.possible.length > 0 && possible.possible.every(p => p.found === 5)) {
        const msg = `Completed 🎉`
        console.debug(`${logPrefix} ${msg}`);
        return msg;
    }

    const msg = `No hint. Guess another letter.`;
    console.debug(`${logPrefix} ${msg}`);
    return msg;
}