import {Application, Controller} from "@hotwired/stimulus";

import type {Words} from "../common/features.ts";

import './style.scss'
import {possibleWords} from "./features.ts";

window.Stimulus = Application.start()


export default class FoximaxController extends Controller {
    static targets = ["form", "entered", "found", "hint"];
    static values = {url: String};

    declare readonly urlValue: string;
    declare readonly formTarget: HTMLFormElement;
    declare readonly enteredTarget: HTMLInputElement;
    declare readonly foundTargets: HTMLInputElement[];
    declare readonly hintTargets: HTMLSpanElement[];

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

        // Get the entered and found letters.
        const enteredLetters = Array.from(this.enteredTarget.value).filter(c => {
            const code = c.charCodeAt(0);
            // alpha ASCII uppercase and lowercase
            return (code > 64 && code < 91) || (code > 96 && code < 123);
        });
        const foundWords: string[] = [];
        this.foundTargets.forEach(foundTarget => {
            const [row, _col] = foundTarget.id.replace('found', '').split('_');
            const value = foundTarget.value ?? "";
            const rowIndex = Number(row) - 1;
            if (foundWords.length <= rowIndex) {
                foundWords.push("");
            }
            foundWords[rowIndex] += value || " ";
        });

        console.log(`enteredLetters ${JSON.stringify(enteredLetters)}`);
        console.log(`foundLetters ${JSON.stringify(foundWords)}`);

        // From all possible words, filter to the available words for each word to find.
        const allWords = this.words ?? [];
        const possible = possibleWords(foundWords, enteredLetters, allWords);

        console.log(`possible ${JSON.stringify(possible.filter(i => i.foundLetterCount > 0))}`);

        // Show the first 3 letters as hints for each found word.
        this.hintTargets.forEach((hintTarget, index) => {
            const possibleItem = possible[index];
            if (possibleItem.filteredWords.length === 1 && possibleItem.foundLetterCount < 5) {
                // show the only available word
                hintTarget.textContent = possibleItem.filteredWords[0];
            } else if (possibleItem.foundLetterCount <= 0) {
                // No letters, show nothing.
                hintTarget.textContent = "";
            } else if (possibleItem.foundLetterCount >= 5) {
                // Word guessed, done.
                hintTarget.textContent = "🎉";
            } else if (possibleItem.filteredWords.length === 0) {
                // No words available.
                hintTarget.textContent = "???";
            } else {
                // Show best 3 letters.
                const wordCount = possibleItem.filteredWords.length;
                const hintLetters = possibleItem.orderedLetters.slice(0, 3).join(" ");
                hintTarget.textContent = `${hintLetters.toUpperCase()} (${wordCount})`;
            }
        })

    }
}

window.Stimulus.register("foximax", FoximaxController);
