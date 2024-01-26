import {expect, test} from 'vitest'
import WordleWords from "./words.js";

/*
 * Parse attempts
 */

test("valid attempt builds correctly a-r-i-s-e-", () => {
    expect(new WordleWords().buildAttempt("a-r-i-s-e-")).toStrictEqual({
        "error": null,
        "filter": [
            {"letter": "a", "symbol": "-"},
            {"letter": "r", "symbol": "-"},
            {"letter": "i", "symbol": "-"},
            {"letter": "s", "symbol": "-"},
            {"letter": "e", "symbol": "-"}],
        "raw": "a-r-i-s-e-",
        "match": ["a-", "r-", "i-", "s-", "e-"],
    });
});
test("valid attempt builds correctly t-o-u?g-h+", () => {
    expect(new WordleWords().buildAttempt("t-o-u?g-h+")).toStrictEqual({
        "error": null,
        "filter": [
            {"letter": "t", "symbol": "-"},
            {"letter": "o", "symbol": "-"},
            {"letter": "u", "symbol": "?"},
            {"letter": "g", "symbol": "-"},
            {"letter": "h", "symbol": "+"}],
        "raw": "t-o-u?g-h+",
        "match": ["t-", "o-", "u?", "g-", "h+"],
    });
});
test("valid attempt builds correctly b-u+n+c+h+", () => {
    expect(new WordleWords().buildAttempt("b-u+n+c+h+")).toStrictEqual({
        "error": null,
        "filter": [
            {"letter": "b", "symbol": "-"},
            {"letter": "u", "symbol": "+"},
            {"letter": "n", "symbol": "+"},
            {"letter": "c", "symbol": "+"},
            {"letter": "h", "symbol": "+"}],
        "raw": "b-u+n+c+h+",
        "match": ["b-", "u+", "n+", "c+", "h+"],
    });
});
test("valid attempt builds correctly a-r?i-s?e+", () => {
    expect(new WordleWords().buildAttempt("a-r?i-s?e+")).toStrictEqual({
        "error": null,
        "filter": [
            {"letter": "a", "symbol": "-"},
            {"letter": "r", "symbol": "?"},
            {"letter": "i", "symbol": "-"},
            {"letter": "s", "symbol": "?"},
            {"letter": "e", "symbol": "+"}],
        "raw": "a-r?i-s?e+",
        "match": ["a-", "r?", "i-", "s?", "e+"],
    });
});
test("valid attempt builds correctly a-r?I?s-e?", () => {
    expect(new WordleWords().buildAttempt("a-r?I?s-e?")).toStrictEqual({
        "error": null,
        "filter": [
            {"letter": "a", "symbol": "-"},
            {"letter": "r", "symbol": "?"},
            {"letter": "i", "symbol": "?"},
            {"letter": "s", "symbol": "-"},
            {"letter": "e", "symbol": "?"}],
        "raw": "a-r?I?s-e?",
        "match": ["a-", "r?", "i?", "s-", "e?"],
    });
});
test("invalid attempt fails (no arg)", () => {
    expect(new WordleWords().buildAttempt()).toStrictEqual({
        "error": null,
        "filter": null,
        "raw": "",
        "match": null,
    });
});
test("invalid attempt fails (null)", () => {
    expect(new WordleWords().buildAttempt(null)).toStrictEqual({
        "error": null,
        "filter": null,
        "raw": "",
        "match": null,
    });
});
test("invalid attempt fails blah", () => {
    expect(new WordleWords().buildAttempt("blah")).toStrictEqual({
        "error": "Invalid format.",
        "filter": null,
        "raw": "blah",
        "match": null,
    });
});
test("invalid attempt fails a-r?i-s?e", () => {
    expect(new WordleWords().buildAttempt("a-r?i-s?e")).toStrictEqual({
        "error": "Must be 10 characters: 5 letters and 5 symbols.",
        "filter": null,
        "raw": "a-r?i-s?e",
        "match": ["a-", "r?", "i-", "s?"],
    });
});
test("invalid attempt fails a-r!i-s?e+", () => {
    expect(new WordleWords().buildAttempt("a-r!i-s?e+")).toStrictEqual({
        "error": "Must be 10 characters: 5 letters and 5 symbols.",
        "filter": null,
        "raw": "a-r!i-s?e+",
        "match": ["a-", "i-", "s?", "e+"],
    });
});

/*
 * Build filter
 */

test("build filter from no arg", () => {
    expect(new WordleWords().buildFilter()).toStrictEqual({
        "any": {"present": "", "absent": ""},
        "0": {"present": "", "absent": ""},
        "1": {"present": "", "absent": ""},
        "2": {"present": "", "absent": ""},
        "3": {"present": "", "absent": ""},
        "4": {"present": "", "absent": ""},
    });
});
test("build filter from empty array", () => {
    expect(new WordleWords().buildFilter([])).toStrictEqual({
        "any": {"present": "", "absent": ""},
        "0": {"present": "", "absent": ""},
        "1": {"present": "", "absent": ""},
        "2": {"present": "", "absent": ""},
        "3": {"present": "", "absent": ""},
        "4": {"present": "", "absent": ""},
    });
});
test("build filter from attempts [a-r?i-s?e+]", () => {
    expect(new WordleWords().buildFilter([
        {
            "error": null,
            "filter": [
                {"letter": "a", "symbol": "-"},
                {"letter": "r", "symbol": "?"},
                {"letter": "i", "symbol": "-"},
                {"letter": "s", "symbol": "?"},
                {"letter": "e", "symbol": "+"}],
            "raw": "a-r?i-s?e+",
            "match": ["a-", "r?", "i-", "s?", "e+"],
        }
    ])).toStrictEqual({
        "any": {"present": "rs", "absent": "ai"},
        "0": {"present": "", "absent": "ai"},
        "1": {"present": "", "absent": "rai"},
        "2": {"present": "", "absent": "ia"},
        "3": {"present": "", "absent": "sai"},
        "4": {"present": "e", "absent": "ai"},
    });
});
test("build filter from attempts [a-r?i-s?e]", () => {
    expect(new WordleWords().buildFilter([
        {
            "error": "Must be 10 characters: 5 letters and 5 symbols.",
            "filter": null,
            "raw": "a-r?i-s?e",
            "match": ["a-", "r?", "i-", "s?"],
        }
    ])).toStrictEqual(null);
});
test("build filter from attempts [a-r-i-s-e-,t-o-u?g-h+,b-u+n+c+h+]", () => {
    expect(new WordleWords().buildFilter([
        {
            "error": null,
            "filter": [
                {"letter": "a", "symbol": "-"},
                {"letter": "r", "symbol": "-"},
                {"letter": "i", "symbol": "-"},
                {"letter": "s", "symbol": "-"},
                {"letter": "e", "symbol": "-"}],
            "raw": "a-r-i-s-e-",
            "match": ["a-", "r-", "i-", "s-", "e-"],
        },
        {
            "error": null,
            "filter": [
                {"letter": "t", "symbol": "-"},
                {"letter": "o", "symbol": "-"},
                {"letter": "u", "symbol": "?"},
                {"letter": "g", "symbol": "-"},
                {"letter": "h", "symbol": "+"}],
            "raw": "t-o-u?g-h+",
            "match": ["t-", "o-", "u?", "g-", "h+"],
        },
        {
            "error": null,
            "filter": [
                {"letter": "b", "symbol": "-"},
                {"letter": "u", "symbol": "+"},
                {"letter": "n", "symbol": "+"},
                {"letter": "c", "symbol": "+"},
                {"letter": "h", "symbol": "+"}],
            "raw": "b-u+n+c+h+",
            "match": ["b-", "u+", "n+", "c+", "h+"],
        }
    ])).toStrictEqual({
        "any": {"present": "u", "absent": "arisetogb"},
        "0": {"present": "", "absent": "atbriseog"},
        "1": {"present": "u", "absent": "roaisetgb"},
        "2": {"present": "n", "absent": "iuarsetogb"},
        "3": {"present": "c", "absent": "sgarietob"},
        "4": {"present": "h", "absent": "earistogb"},
    });
});

test("build filter from attempts that don't make sense [a-r?i-s?e+,t-o-u?g-h+]", () => {
    expect(new WordleWords().buildFilter([
        {
            "error": null,
            "filter": [
                {"letter": "a", "symbol": "-"},
                {"letter": "r", "symbol": "?"},
                {"letter": "i", "symbol": "-"},
                {"letter": "s", "symbol": "?"},
                {"letter": "e", "symbol": "+"}],
            "raw": "a-r?i-s?e+",
            "match": ["a-", "r?", "i-", "s?", "e+"],
        },
        {
            "error": null,
            "filter": [
                {"letter": "t", "symbol": "-"},
                {"letter": "o", "symbol": "-"},
                {"letter": "u", "symbol": "?"},
                {"letter": "g", "symbol": "-"},
                {"letter": "h", "symbol": "+"}],
            "raw": "t-o-u?g-h+",
            "match": ["t-", "o-", "u?", "g-", "h+"],
        }
    ])).toStrictEqual({
        "any": {"present": "rsu", "absent": "aitog"},
        "0": {"present": "", "absent": "atiog"},
        "1": {"present": "", "absent": "roaitg"},
        "2": {"present": "", "absent": "iuatog"},
        "3": {"present": "", "absent": "sgaito"},
        "4": {"present": "e", "absent": "aitog"},
    });
});

/*
 * Filter words
 */
const testingWords = ['arise', 'tough', 'party', 'booms'];

test("filter words no args", () => {
    expect(new WordleWords().filterWords()).toStrictEqual(null);
});
test("filter words no words", () => {
    expect(new WordleWords().filterWords(null, {
        "any": {"present": "", "absent": ""},
        "0": {"present": "", "absent": ""},
        "1": {"present": "", "absent": ""},
        "2": {"present": "", "absent": ""},
        "3": {"present": "", "absent": ""},
        "4": {"present": "", "absent": ""},
    })).toStrictEqual([]);
});
test("filter words no filter", () => {
    expect(new WordleWords().filterWords(testingWords)).toStrictEqual(null);
});
test("filter words empty filter", () => {
    expect(new WordleWords().filterWords(
        testingWords,
        {
            "any": {"present": "", "absent": ""},
            "0": {"present": "", "absent": ""},
            "1": {"present": "", "absent": ""},
            "2": {"present": "", "absent": ""},
            "3": {"present": "", "absent": ""},
            "4": {"present": "", "absent": ""},
        })).toStrictEqual(testingWords);
});
test("filter words filter with no matches", () => {
    expect(new WordleWords().filterWords(
        testingWords,
        {
            "any": {"present": "u", "absent": "arisetogb"},
            "0": {"present": "", "absent": "arisetogb"},
            "1": {"present": "u", "absent": "arisetogb"},
            "2": {"present": "n", "absent": "arisetougb"},
            "3": {"present": "c", "absent": "arisetogb"},
            "4": {"present": "h", "absent": "arisetogb"},
        })).toStrictEqual([]);
});
test("filter words filter with some matches", () => {
    expect(new WordleWords().filterWords(
        [].concat(testingWords).concat(['lunch']),
        {
            "any": {"present": "u", "absent": "arisetogb"},
            "0": {"present": "", "absent": "arisetogb"},
            "1": {"present": "u", "absent": "arisetogb"},
            "2": {"present": "n", "absent": "arisetougb"},
            "3": {"present": "c", "absent": "arisetogb"},
            "4": {"present": "h", "absent": "arisetogb"},
        })).toStrictEqual(['lunch']);
});

/*
 * Attempts to words
 */
test("words from attempts that are valid", () => {
    expect(new WordleWords().wordsFromAttempts(
        ['a+r-i-s-e-', 'a+u-n-t-y-', 'a+b-a-c-k-', 'a+l+l-o+w-', 'a+l+o+o+f+'],
        ['arise', 'aunty', 'aback', 'allow', 'aloof', 'remix'])
    ).toStrictEqual(['aloof']);
});
test("words from attempts that don't make sense one left", () => {
    expect(new WordleWords().wordsFromAttempts(
        ['a-r?i-s?e+', 't-o-u?g-h+'],
        ['arise', 'aunty', 'aback', 'allow', 'aloof', 'remix', 'lunch', 'tough', 'touch', 'sprue'])
    ).toStrictEqual(['sprue']);
});
test("words from attempts that don't make sense none left", () => {
    expect(new WordleWords().wordsFromAttempts(
        ['a-r?i-s?e+', 't-o-u?g-h+', 's-p-r-u-e-'],
        ['arise', 'aunty', 'aback', 'allow', 'aloof', 'remix', 'lunch', 'tough', 'touch', 'sprue'])
    ).toStrictEqual([]);
});