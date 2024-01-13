import {Application, Controller} from "https://unpkg.com/@hotwired/stimulus@3.2.2/dist/stimulus.js"

window.Stimulus = Application.start()

Stimulus.register("wordle", class extends Controller {
    static targets = [
        "entry1", "entry2", "entry3", "entry4",
        "list", "item", "itemTemplate"
    ];
    static values = {url: String};

    wordData;

    connect() {
        this.load();
    }

    entryChanged(event) {
        this.removeWordCards();
        this.addWordCards();
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
                    this.removeWordCards();
                    this.addWordCards();
                });
        }
    }

    removeWordCards() {
        this.itemTargets.forEach((itemElement) => {
            itemElement.remove();
        });
    }

    addWordCard(value) {
        const item = this.itemTemplateTarget.content.cloneNode(true);
        const cardText = item.querySelector('.card-text');
        cardText.textContent = value;
        this.listTarget.append(item);
    }

    addWordCards() {
        const entry1 = this.entry1Target.value;
        const entry2 = this.entry2Target.value;
        const entry3 = this.entry3Target.value;
        const entry4 = this.entry4Target.value;

        const entry1Val = this.validateEntry(entry1);
        const entry2Val = this.validateEntry(entry2);
        const entry3Val = this.validateEntry(entry3);
        const entry4Val = this.validateEntry(entry4);

        // TODO: .checkValidity()

        const words = this.filterWordData([
            entry1Val, entry2Val, entry3Val, entry4Val
        ]);
        words.forEach((word) => {
            this.addWordCard(word);
        });
    }

    /**
     * Validate an entered attempt.
     * @param {string} entry
     * @return {string|null} A string containing only the letters if valid, otherwise null
     */
    validateEntry(entry) {
        const re = /^([a-z][-+?]){1,5}$/gim;

        /*
        Examples:
        'a-r?i-s?e+'
         */

        const result = entry.match(re);
        if (result !== null) {
            return result[0];
        }
        return null;
    }

    /**
     * Get the words that fulfill the restrictions created by the entered attempts.
     * @param {string[]} entries
     * @return {string[]} The possible words.
     */
    filterWordData(entries) {
        // create a shallow copy of the word data
        const result = this.wordData.slice();

        // TODO: build the entries into a mapping of character index to
        // whether the letter can be in that index
        // +: must be at that index, don't know about other indexes
        // -: cannot be at any index
        // ?: cannot be at that index, must be at least one of the other indexes
        for (const entry of entries) {
            if(!entry){
                continue;
            }
        }
        console.log(entries);
        const example = this.wordData.slice(0, 30);
        // TODO
        return example;
    }

})