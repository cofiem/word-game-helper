import {expect, test} from 'vitest'
import Helper from "./impl.js";

/*
 * Check valid words
 */

test("valid words are recognised", () => {
    const value = 'imposition reseal';
    const matches = [
        'impositions',
        'positions',
        'position',
        'imposes',
        'impose',
        'posses',
        'mosses',
        'posse',
        'sites',
        'posit',
        'immit',
        'trees',
        'mitre',
    ];
    const notMatches = [
        'z',
        'pasta',
    ];

    expect(new Helper().filterWords(([].concat(matches).concat(notMatches)), value)).toEqual(matches);
});