import {Application, Controller} from "@hotwired/stimulus";

import './style.scss'

import * as bootstrap from 'bootstrap';

window.Stimulus = Application.start()


export default class FoximaxController extends Controller {
    static targets = ["found", "form"];
    static values = {url: String};

    declare readonly urlValue: string;
    declare readonly formTarget: HTMLFormElement;
    declare readonly foundTargets: HTMLInputElement[];

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
    }
}

window.Stimulus.register("foximax", FoximaxController);
