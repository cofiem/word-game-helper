import {Application, Controller} from "@hotwired/stimulus";
import {type Attempt, buildAttempt, buildFilter, filterWords} from "./features.ts";
import type {Word} from "../common/features.ts";

import './style.scss'

window.Stimulus = Application.start()


export default class WordleController extends Controller {
    static targets = ["attempt", "list", "item", "itemTemplate", "wordsShown", "wordsMatch", "form"];
    static values = {url: String};

    declare readonly urlValue: string;
    declare readonly formTarget: HTMLFormElement;
    declare readonly itemTargets: HTMLDivElement[];
    declare readonly wordsShownTarget: HTMLSpanElement;
    declare readonly wordsMatchTarget: HTMLSpanElement;
    declare readonly itemTemplateTarget: HTMLTemplateElement;
    declare readonly listTarget: HTMLDivElement;
    declare readonly attemptTargets: HTMLInputElement[];

    /**
     * Stores the loaded word list.
     */
    words?: string[];

    connect() {
        this.load();
    }

    /**
     * Load the word data from the server.
     */
    load() {
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
        this.wordsShownTarget.textContent = words.shown.length.toString();
        this.wordsMatchTarget.textContent = words.availableCount.toString();
    }

    /**
     * When any of the attempt entries change, updated the list of words.
     * @param event
     */
    entryChanged(event: Event) {
        event.preventDefault();
        this.refresh();
    }

    /**
     * Add a word card.
     * @param  value The word.
     */
    addWordCard(value: Word) {
        const item = this.itemTemplateTarget.content.cloneNode(true) as DocumentFragment;
        const cardText = item.querySelector('.card-text');
        if (cardText) {
            cardText.textContent = value;
            this.listTarget.append(item);
        }
    }

    /**
     * Parse the attempt entry from the element.
     * @param element The element containing the entry value.
     * @return Parsed result.
     */
    attemptEntry(element: HTMLInputElement): Attempt {
        const raw = element.value;
        return buildAttempt(raw);
    }

    /**
     * Get the words that fulfill the restrictions created by the entered attempts.
     * @param  attempts
     * @return  The possible words.
     */
    filterWords(attempts: Attempt[]): { shown: string[], availableCount: number } {
        const filter = buildFilter(attempts);
        let words = filterWords(this.words, filter) || this.words;

        const availableWords = words?.length;
        const maxShownWords = 30


        // If there are too many words, show only the first 30 words.
        const outcome = words?.slice(0, maxShownWords);

        return {
            shown: outcome ?? [],
            availableCount: availableWords ?? 0,
        };
    }

    validate(element: HTMLInputElement, attemptInfo: Attempt) {
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

window.Stimulus.register("wordle", WordleController);
