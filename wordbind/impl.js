export default class Helper {

    #logPrefix = '[Word Game Helper - wordbind]';

    /**
     * Filter the words using the value.
     * @param words All possible words.
     * @param value The phrase to use to filter the word list.
     * @return {[string]} The words that match the filter.
     */
    filterWords(words, value) {
        if (!words) {
            console.warn(`${this.#logPrefix} No words.`);
            return null;
        }
        if (!value) {
            console.warn(`${this.#logPrefix} No value.`);
            return null;
        }

        const raw = [...value.replace(' ', '')].map((char) => char + '*').join('');
        const re = new RegExp('^' + raw + '$', "idm");

        const result = words.filter((word) => re.test(word)) || [];

        // sort in order from longest to shortest
        result.sort((a, b) => {
                if (a.length === b.length) {
                    return 0;
                } else if (a.length > b.length) {
                    return -1;
                } else {
                    return 1;
                }
            })

        return result;
    };
}
