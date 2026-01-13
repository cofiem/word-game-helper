import {createWordData} from "../common/build-data.ts";

// generate the data file
const sourcePaths = ["./src/data/scowl-2020.12.07/final"];
const wordleDataPath = "./src/foximax/data.json";
const exclude = [
    'abbreviations',
    'proper-names',
    'contractions',
    'roman-numerals',
    'hacker',
    '.80',
    '.95',
];
console.log(sourcePaths);
await createWordData(sourcePaths, wordleDataPath, exclude, 5, 5);
