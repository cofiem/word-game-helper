import {Application, Controller} from "@hotwired/stimulus";
import type {Words} from "../common/features.ts";
import {buildHint, getEnteredLetters, getFoundWords, logPrefix, possibleWords} from "./features.ts";

import './style.scss'

window.Stimulus = Application.start()


export default class FoximaxController extends Controller {
    static targets = ["form", "entered", "found", "hint"];
    static values = {url: String};

    declare readonly urlValue: string;
    declare readonly formTarget: HTMLFormElement;
    declare readonly enteredTarget: HTMLInputElement;
    declare readonly foundTargets: HTMLInputElement[];
    declare readonly hintTarget: HTMLSpanElement;

    /**
     * Stores the loaded word list.
     */
    words?: Words;


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
     * When any of the attempt entries change, updated the list of words.
     * @param event
     */
    entryChanged(event: Event) {
        event.preventDefault();
        this.refresh();
    }

    refresh() {
        this.formTarget.classList.remove('was-validated');
        this.formTarget.checkValidity();

        console.debug(`${logPrefix} =========== Refresh ===========`);

        // Get the entered and found letters.
        const enteredLetters = getEnteredLetters(this.enteredTarget.value);
        const foundWords = getFoundWords(this.foundTargets.map(foundTarget => {
            const [row, col] = foundTarget.id.replace('found', '').split('_');
            const value = foundTarget.value ?? "";
            return {value, row, col};
        }));


        // From all possible words, filter to the available words for each word to find.
        const allWords = this.words ?? [];
        const possible = possibleWords(foundWords, enteredLetters, allWords);

        // Show the hints for the next letter.
        this.hintTarget.textContent = buildHint(possible, enteredLetters);
    }
}

window.Stimulus.register("foximax", FoximaxController);
