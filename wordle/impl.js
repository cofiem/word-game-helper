export default class WordleWords {

    #logPrefix = '[Word Game Helper - wordle]';

    #attemptOutcomePresent = '+';
    #attemptOutcomeAbsent = '-';
    #attemptOutcomeOtherPosition = '?';

    #indexAny = 'any';

    #groupPresent = 'present';
    #groupAbsent = 'absent';

    /**
     * Parse the attempt (answer and outcome using special pattern) and build the information object.
     * @param {string} value The attempted answer and outcome.
     * @return {{filter: (null|{'symbol': string, 'letter': string}[]), raw:string, error: null|string, match: string[]}}
     */
    buildAttempt(value) {
        value = value ? value : "";

        if (!value) {
            const result = {
                'raw': value,
                'filter': null,
                'error': null,
                'match': null,
            }
            console.info(`${this.#logPrefix} Valid empty attempt.`, result);
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
            console.warn(`${this.#logPrefix} Invalid attempt.`, result);
            return result;
        }
        if (charSymbols.length !== 5) {
            const result = {
                'raw': value,
                'filter': null,
                'error': "Must be 10 characters: 5 letters and 5 symbols.",
                'match': charSymbols,
            }
            console.warn(`${this.#logPrefix} Invalid attempt.`, result);
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
        console.info(`${this.#logPrefix} Valid attempt.`, result);
        return result;
    }

    emptyFilter() {
        const keyAny = this.#indexAny;
        const p = this.#groupPresent;
        const a = this.#groupAbsent;
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
     * @param {{filter: (null|{'symbol': string, 'letter': string}[]), raw:string, error: null|string, match: string[]}[]} attempts The array of attempt information.
     * @return {null | {['any'|number]: {absent?: string | undefined, present?: string | undefined}}}
     */
    buildFilter(attempts) {
        let isValid = true;
        attempts = attempts ? attempts : [];
        const filter = this.emptyFilter();

        // populate the individual indexes first
        (attempts || []).forEach((attempt) => {
            if (!attempt || attempt.error) {
                isValid = false;
                console.warn(`${this.#logPrefix} Can't build filter due to invalid attempt.`, attempt);
            }
            (attempt.filter || []).forEach((filterItem, filterItemIndex) => {
                if (!isValid || filterItem == null) {
                    return;
                }
                const letter = filterItem.letter;
                const symbol = filterItem.symbol;
                if (symbol === this.#attemptOutcomePresent) {
                    // +: must be at that index, can't say either way about other indexes
                    this.addLetter(filter, filterItemIndex, this.#groupPresent, letter);

                } else if (symbol === this.#attemptOutcomeOtherPosition) {
                    // ?: cannot be at that index
                    this.addLetter(filter, filterItemIndex, this.#groupAbsent, letter);

                } else if (symbol === this.#attemptOutcomeAbsent) {
                    // -: cannot be at that index
                    this.addLetter(filter, filterItemIndex, this.#groupAbsent, letter);
                }
            });
        });

        // just stop and return if the filter is not valid
        if (!isValid) {
            console.warn(`${this.#logPrefix} Not building filter due to invalid attempt.`);
            return null;
        }

        // then make deductions about the overall presence or absence of letters
        (attempts || []).forEach((attempt) => {
            (attempt.filter || []).forEach((filterItem) => {
                const letter = filterItem.letter;
                const symbol = filterItem.symbol;

                if (symbol === this.#attemptOutcomeOtherPosition) {
                    // must be at least one of the other indexes
                    this.addLetter(filter, this.#indexAny, this.#groupPresent, letter);

                } else if (symbol === this.#attemptOutcomeAbsent) {
                    // for each index, if letter is not already 'present', then the letter can't be present
                    let foundLetterPresent = false;
                    [...Array(5).keys()].forEach((key) => {
                        if (!filter[key].present.includes(letter)) {
                            this.addLetter(filter, key, this.#groupAbsent, letter);
                        } else {
                            foundLetterPresent = true;
                        }
                    });

                    // if the letter is not already present at any index, then it cannot be present at any index
                    if (!foundLetterPresent) {
                        this.addLetter(filter, this.#indexAny, 'absent', letter);
                    }
                }
            });
        });

        console.info(`${this.#logPrefix} Built filter.`, filter);

        return filter;

    }

    /**
     * Add a letter to the container in the index and group.
     * @param {{['any'|number]: {absent?: string, present?: string}}} container The container.
     * @param {('any'|number)} index The index.
     * @param {('present'|'absent')} name The group name.
     * @param {string} letter The letter to add.
     */
    addLetter(container, index, name, letter) {
        const validContainer = container !== null && container !== undefined;
        const validIndex = [this.#indexAny, '0', '1', '2', '3', '4', 0, 1, 2, 3, 4].includes(index);
        const validName = [this.#groupPresent, this.#groupAbsent].includes(name);
        const validLetter = 'abcdefghijklmnopqrstuvwxyz'.includes(letter);
        if (!validContainer || !validIndex || !validName || !validLetter) {
            console.error(`${this.#logPrefix} Must provide values for all arguments to addLetter. container ${container}, index ${index}, name ${name}, letter ${letter}.`);
            return;
        }

        index = index.toString();

        const current = container[index][name];

        if (name === this.#groupPresent && index !== this.#indexAny && current === letter) {
            // don't add the same letter more than once
            return;
        }

        if (name === this.#groupPresent && index !== this.#indexAny && current) {
            console.warn(`${this.#logPrefix} Unexpected more than one letter for present at an index. Existing ${current}, new ${letter}.`);
            return;
        }

        if (!current.includes(letter)) {
            container[index][name] += letter;
        }
    }

    /**
     * Keep only the words that match the filter.
     * @param words {[string]} All possible words.
     * @param filter {{['any'|number]: {absent?: string | undefined, present?: string | undefined}}} Return only words that match this filter.
     * @return {string[]} The words that match the filter.
     */
    filterWords(words, filter) {
        if (!filter) {
            console.warn(`${this.#logPrefix} No filter.`);
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
                if (filter[index].absent.length > 0 && filter[index].absent.includes(char)) {
                    // word must not contain absent char in index
                    return false;
                }
                if (filter[index].present.length > 0 && !filter[index].present.includes(char)) {
                    // word must contain present char at index
                    return false;
                }
            }

            return true;
        });

        result = this.orderRemaining(result, filter);

        console.info(`${this.#logPrefix} Filter matched ${result.length} words.`, filter);
        return result;
    }

    wordsFromAttempts(attempts, words) {
        const builtAttempts = (attempts || []).map((attempt) => this.buildAttempt(attempt));
        const builtFilter = this.buildFilter(builtAttempts);
        return this.filterWords(words, builtFilter);
    }

    /**
     * Order words according to the value (likelihood, usefulness) of the word as a next guess.
     *
     * @param words {[string]} The words that match the filter.
     * @param filter {{['any'|number]: {absent?: string | undefined, present?: string | undefined}}} Return only words that match this filter.
     * @return {[string]} Re-ordered words.
     */
    orderRemaining(words, filter) {
        // value / most likely / most useful is defined as:
        // - contains more, and different, not-yet-guessed letters
        // - contains more common letters [done]
        // - contains letters that exclude the most remaining options [done]

        // Options for ordering:
        // words = this.orderRandom(words);
        // this.orderLetterFrequency(words);
        this.orderExcludeCount(words, filter);

        return words;
    }

    /**
     * Order the words in a random order.
     * @param words {string[]} The possible words.
     * @return {string[]} The ordered words.
     */
    orderRandom(words) {
        // If there are more than 50 words, choose a random set of words.
        const maxWordsCount = 50;
        const availableWords = words.length;
        const result = [];
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
     * @param words {string[]} The possible words.
     * @return {string[]} The ordered words.
     */
    orderLetterFrequency(words) {
        // https://en.wikipedia.org/wiki/Letter_frequency
        const lettersFrequency = "etaoinshrdlcumwfgypbvkxjqz"

        // Letter Frequency
        // Assign each letter a value from 26 for the first letter to 1 for the last.
        // The score for a word is the mean of the values.

        const count = lettersFrequency.length;
        const letters = Array.from(lettersFrequency).map((value, index) => [value, count - index])
        const lettersMap = new Map(letters);
        const wordScoreMap = new Map();

        const scoreFunction = function (word) {
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

        const compareFunction = function (a, b) {
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
     * @param words {string[]} The possible words.
     * @param filter {{['any'|number]: {absent?: string | undefined, present?: string | undefined}}} Return only words that match this filter.
     * @return {string[]} The ordered words.
     */
    orderExcludeCount(words, filter) {
        // Words that exclude the most remaining words
        // Assuming that a word has no more included letters ('+' or '?').
        const requiredLetters = filter['any']['present'];
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

        const compareFunction = function (a, b) {
            const aValue = wordsExcludeCountMap.get(a) ?? 0;
            const bValue = wordsExcludeCountMap.get(b) ?? 0;
            return aValue > bValue ? -1 : (aValue < bValue ? 1 : 0);
        };

        return words.sort(compareFunction);
    }
}

