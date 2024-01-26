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
     * @return {{('any'|number): {absent: string, present: string}}}
     */
    buildFilter(attempts) {
        let isValid = true;
        attempts = attempts ? attempts : [];
        const filter = this.emptyFilter();

        // populate the individual indexes first
        (attempts || []).forEach((attempt, index) => {
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
        (attempts || []).forEach((attempt, index) => {
            (attempt.filter || []).forEach((filterItem, filterItemIndex) => {
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
     * @param {{('any'|number): {absent: string, present: string}}} container The container.
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
     * @param {[string]} words All possible words.
     * @param {{('any'|number): {absent: string, present: string}}} filter Return only words that match this filter.
     * @return {[string]} The words that match the filter.
     */
    filterWords(words, filter) {
        if (!filter) {
            console.warn(`${this.#logPrefix} No filter.`);
            return null;
        }
        const result = (words || []).filter((word) => {
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

        console.info(`${this.#logPrefix} Filter matched ${result.length} words.`, filter);
        return result;
    }

    wordsFromAttempts(attempts, words) {
        const builtAttempts = (attempts || []).map((attempt) => this.buildAttempt(attempt));
        const builtFilter = this.buildFilter(builtAttempts);
        return this.filterWords(words, builtFilter);
    }
}
