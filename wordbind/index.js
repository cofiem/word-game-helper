import {Application, Controller} from "https://unpkg.com/@hotwired/stimulus@3.2.2/dist/stimulus.js"
import Helper from "./impl.js";

window.Stimulus = Application.start()


class WordBindController extends Controller {
    static targets = ["puzzle", "list", "item", "itemTemplate", "wordsShown", "form"];
    static values = {url: String};

    /**
     * Stores the loaded word list.
     */
    words;

    /**
     * Helper class.
     */
    helper;

    connect() {
        this.load();
    }

    /**
     * Load the word data from the server.
     */
    load() {
        if (!this.helper) {
            this.helper = new Helper();
        }
        if (!this.words) {
            fetch(this.urlValue)
                .then(response => response.json())
                .then(data => {
                    this.words = data;
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
        // remove the validate class
        // this.formTarget.classList.remove('was-validated');

        // check validity
        this.formTarget.checkValidity();

        // remove all the existing word cards
        this.itemTargets.forEach((itemTarget) => itemTarget.remove());

        // validate the puzzleValue
        this.validate(this.puzzleTarget);

        // apply the validate class
        // this.formTarget.classList.add('was-validated');

        // get the words that match the filters
        const words = this.filterWords(this.puzzleTarget.value);

        // add word cards
        words.shown.forEach((value) => this.addWordCard(value));

        // update the shown display
        this.wordsShownTarget.textContent = words.shown.length;
    }

    /**
     * When the puzle word(s) change, updated the list of words.
     * @param event
     */
    puzzleChanged(event) {
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
     * Get the words that fulfill the restrictions created by the entered attempts.
     * @param {string} puzzleValue
     * @return {{show:string[],availableCount:number} The possible words.
     */
    filterWords(puzzleValue) {
        let words = this.helper.filterWords(this.words, puzzleValue) || [];

        const availableWords = words ? words.length : 0;
        const maxShownWords = 100

        // Show only the first maxShownWords, in descending order of length
        const outcome = words ? words.slice(0, maxShownWords) : [];

        return {
            'shown': outcome,
            'availableCount': availableWords,
        };
    }

    /**
     * Validate the build puzzle info object.
     * @param element The HTML element to show validation outcome.
     */
    validate(element) {
        const value = element.value;
        if (value.length > 1) {
            element.classList.add('is-valid');
            element.classList.remove('is-invalid');
        } else if (value.length < 1) {
            element.classList.add('is-invalid');
            element.classList.remove('is-valid');
        }
    }
}

Stimulus.register("wordbind", WordBindController);
