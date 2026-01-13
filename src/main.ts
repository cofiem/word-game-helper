// Import our custom CSS
import './style.scss'

// Import all of Bootstrap's JS
// import * as bootstrap from 'bootstrap'

import type {Application} from "@hotwired/stimulus";

declare global {
    interface Window {
        Stimulus: Application;
    }
}
