import {Application, Controller} from "https://unpkg.com/@hotwired/stimulus@3.2.2/dist/stimulus.js"

window.Stimulus = Application.start()

// TODO: .checkValidity()


class WordleController extends Controller {
    static targets = ["attempt", "list", "item", "itemTemplate", "wordsShown", "wordsMatch", "form"];
    static values = {url: String};

    /**
     * Stores the loaded word list.
     */
    wordData;

    connect() {
        this.load();
    }

    /**
     * Load the word data from the server.
     */
    load() {
        if (!this.wordData) {
            fetch(this.urlValue)
                .then(response => response.json())
                .then(data => {
                    this.wordData = data;
                })
                .then(() => {
                    this.refresh();
                });
        }
    }

    /**
     * Refresh the list of possible words.
     */
    refresh() {
        this.formTarget.classList.remove('was-validated');
        this.formTarget.checkValidity();

        // remove all the existing word cards
        this.itemTargets.forEach((itemTarget) => itemTarget.remove());

        // get the filters from the attempt entries
        const filters = this.attemptTargets.map((attemptTarget) => {
            const info = this.attemptEntry(attemptTarget);
            this.validate(attemptTarget, info);
            return info
        });
        this.formTarget.classList.add('was-validated');

        // get the words that match the filters
        const words = this.filterWords(filters);

        // add word cards
        words.shown.forEach((value) => this.addWordCard(value));

        // update the shown / available display
        this.wordsShownTarget.textContent = words.shown.length;
        this.wordsMatchTarget.textContent = words.availableCount;
    }

    /**
     * When any of the attempt entries change, updated the list of words.
     * @param event
     */
    entryChanged(event) {
        this.refresh();
    }

    /**
     * Add a word card.
     * @param value The word.
     */
    addWordCard(value) {
        const item = this.itemTemplateTarget.content.cloneNode(true);
        const cardText = item.querySelector('.card-text');
        cardText.textContent = value;
        this.listTarget.append(item);
    }

    /*
    Examples:

    0: a-r-i-s-e-
    1: t-o-u?g-h+
    2: b-u+n+c+h+
    3: p-u+n+c+h+
    4: l+u+n+c+h+

    0: a-r?i-s?e+

     */

    /**
     * Parse the attempt entry from the element.
     * @param element The element containing the entry value.
     * @return {{raw: *}} Parsed result.
     */
    attemptEntry(element) {
        const raw = element.value;
        const re = /[a-z][\-+?]/gi;
        const charSymbols = raw.match(re);
        if (!charSymbols) {
            return {
                'raw': raw,
                'filter': null,
                'error': "Invalid format.",
            }
        }
        if (charSymbols.length !== 5) {
            return {
                'raw': raw,
                'filter': null,
                'error': "Must be 10 characters: 5 letters and 5 symbols.",
            }
        }

        const filter = charSymbols.map((item) => {
            return {'letter': item[0], 'symbol': item[1]}
        })
        return {
            'raw': raw,
            'filter': filter,
            'error': null,
        }
    }

    /**
     * Get the words that fulfill the restrictions created by the entered attempts.
     * @param {{raw:string,filter:{name, symbol},error:string}[]} filters
     * @return {{show:string[],availableCount:number} The possible words.
     */
    filterWords(filters) {
        // build a mapping of allowed characters in each position
        const attemptTargets = this.attemptTargets;
        const alphabet = 'abcdefghijklmnopqrstuvwxyz';
        const mapping = {'any': {'present': '', 'absent': ''}};
        attemptTargets.forEach((element, index) => {
            mapping[index] = {'present': '', 'absent': ''};
        });
        (filters || []).forEach((filter, index) => {
            (filter.filter || []).forEach((filterItem, filterItemIndex) => {
                const letter = filterItem.letter;
                const symbol = filterItem.symbol;
                if (symbol === '+') {
                    // +: must be at that index, don't know about other indexes
                    this.addLetter(mapping, filterItemIndex, 'present', letter);

                } else if (symbol === '?') {
                    // ?: cannot be at that index
                    this.addLetter(mapping, filterItemIndex, 'absent', letter);

                    // must be at least one of the other indexes
                    this.addLetter(mapping, 'any', 'present', letter);

                } else if (symbol === '-') {
                    // -: cannot be at any index
                    this.addLetter(mapping, 'any', 'absent', letter);
                }
            });
        });

        // filter the words
        let words = this.wordData.filter((word) => {
            // word must contain the 'any' 'present' letters
            const anyPresent = Array.from(mapping.any.present)
            for (const char of anyPresent) {
                if (anyPresent.length > 0 && !word.includes(char)) {
                    return false;
                }
            }

            // word must not contain the 'any' 'absent' letters
            const anyAbsent = Array.from(mapping.any.absent)
            for (const char of anyAbsent) {
                if (anyAbsent.length > 0 && word.includes(char)) {
                    return false;
                }
            }

            // check the known char at index
            const wordArray = Array.from(word);
            for (let index = 0; index < wordArray.length; index++) {
                const char = wordArray[index];
                if (mapping[index].absent.length > 0 && mapping[index].absent.includes(char)) {
                    // word must not contain absent char in index
                    return false;
                }
                if (mapping[index].present.length > 0 && !mapping[index].present.includes(char)) {
                    // word must contain present char at index
                    return false;
                }
            }

            return true;
        });

        const availableWords = words.length;
        const maxShownWords = 30
        const randomWordsThreshold = 50;

        // If there are more than 50 words, choose a random set of words.
        if (availableWords < 1 || availableWords > randomWordsThreshold) {
            const result = [];
            let selectedWord = null;
            do {
                selectedWord = words[Math.floor(Math.random() * availableWords)];
                if (!result.includes(selectedWord)) {
                    result.push(selectedWord)
                }
            } while (result.length < maxShownWords)
            words = result;
        }

        // If there are too many words, show only the first 30 words.
        const outcome = words.slice(0, maxShownWords);
        console.log(filters, mapping, words, outcome, availableWords);
        return {
            'shown':outcome,
            'availableCount':availableWords,
        };
    }

    addLetter(container, index, name, letter) {
        if (!container[index][name].includes(letter)) {
            container[index][name] += letter;
        }
    }

    validate(element, attemptInfo){
        const value = element.value;
        if (value.length < 1){
            element.classList.add('is-valid');
            element.classList.remove('is-invalid');
        } else if (value.length !== 10 || attemptInfo.error || !attemptInfo.filter){
            element.classList.add('is-invalid');
            element.classList.remove('is-valid');
        }
    }
}

Stimulus.register("wordle", WordleController);
