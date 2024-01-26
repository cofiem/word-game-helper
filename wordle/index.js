import {Application, Controller} from "https://unpkg.com/@hotwired/stimulus@3.2.2/dist/stimulus.js"
import WordleWords from "./words.js";

window.Stimulus = Application.start()


class WordleController extends Controller {
    static targets = ["attempt", "list", "item", "itemTemplate", "wordsShown", "wordsMatch", "form"];
    static values = {url: String};

    /**
     * Stores the loaded word list.
     */
    wordData;

    /**
     * Helper class.
     */
    wordleWords;

    connect() {
        this.load();
    }

    /**
     * Load the word data from the server.
     */
    load() {
        if(!this.wordleWords){
            this.wordleWords = new WordleWords();
        }
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
     * @param {string} value The word.
     */
    addWordCard(value) {
        const item = this.itemTemplateTarget.content.cloneNode(true);
        const cardText = item.querySelector('.card-text');
        cardText.textContent = value;
        this.listTarget.append(item);
    }

    /**
     * Parse the attempt entry from the element.
     * @param element The element containing the entry value.
     * @return {{filter: (null|{'symbol': string, 'letter': string}[]), raw:string, error: null|string, match: string[]}[]} Parsed result.
     */
    attemptEntry(element) {
        const raw = element.value;
        return this.wordleWords.buildAttempt(raw);
    }

    /**
     * Get the words that fulfill the restrictions created by the entered attempts.
     * @param {{filter: (null|{'symbol': string, 'letter': string}[]), raw:string, error: null|string, match: string[]}[]} attempts
     * @return {{show:string[],availableCount:number} The possible words.
     */
    filterWords(attempts) {
        const filter = this.wordleWords.buildFilter(attempts);
        let words = this.wordleWords.filterWords(this.wordData, filter) || this.wordData;

        const availableWords = words.length;
        const maxShownWords = 30
        const randomWordsThreshold = 50;

        // If there are more than 50 words, choose a random set of words.
        if (availableWords > randomWordsThreshold) {
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

        return {
            'shown': outcome,
            'availableCount': availableWords,
        };
    }

    validate(element, attemptInfo) {
        const value = element.value;
        if (value.length < 1) {
            element.classList.add('is-valid');
            element.classList.remove('is-invalid');
        } else if (value.length !== 10 || attemptInfo.error || !attemptInfo.filter) {
            element.classList.add('is-invalid');
            element.classList.remove('is-valid');
        }
    }
}

Stimulus.register("wordle", WordleController);
