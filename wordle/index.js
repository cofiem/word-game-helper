import { Application, Controller } from "https://unpkg.com/@hotwired/stimulus@3.2.2/dist/stimulus.js"
window.Stimulus = Application.start()

Stimulus.register("hello", class extends Controller {
    static targets = [ "name" ]

    connect() {
    }
})