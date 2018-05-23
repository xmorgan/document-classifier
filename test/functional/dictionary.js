/* eslint-disable no-unused-vars */
'use strict';

const fs = require('fs-extra');
const path = require('path');

const DictionaryBuilder = require('../../lib/dictionary-builder/index');
const DictionaryFilter = require('../../lib/dictionary-builder/dictionary-filter');
const readerCache = require('../../lib/reader-cache');
const Classifier = require('../../lib/classifier');
const Dataset = require('../../lib/data-builder/dataset');
const {getFolders} = require('../../lib/data-builder/utils');

const root = 'C:\\Users\\dmitr\\Desktop\\20_newsgroup';
const desktop = 'C:\\Users\\dmitr\\Desktop';

// test1File(path.resolve(root, 'alt.atheism', '49960'), path.resolve(desktop, '49960.txt'));
testFolders(1, path.resolve(desktop, '20_newsgroup.txt'));

async function test1File(file, output) {
    const dictionaryBuilder = new DictionaryBuilder();
    const reader = readerCache.get(file);
    await dictionaryBuilder.add(reader);

    const dictionary = filterDictionary(dictionaryBuilder.build());

    printDictionaryStats(dictionary);
    await printDictionaryWithCount(dictionary, output);
}

function filterDictionary(dictionary) {
    return DictionaryFilter.filter(dictionary, DictionaryFilter.ONCE);
}

async function testFolders(rate, output) {
    console.time('prepare dictionary');

    const folders = await getFolders(root);
    const dataset = await Dataset.createAndSplit(folders, rate);

    const classifier = new Classifier(dataset, {dictionaryFilters: {count: 3}});

    await classifier.prepare();
    console.timeEnd('prepare dictionary');

    printDictionaryStats(classifier.dictionary);
    await printDictionaryWithCount(classifier.dictionary, output);
}

async function printDictionaryWithCount(dictionary, output) {
    const words = [];
    dictionary.words.forEach((word) => {
        words.push({word, count: dictionary.count(word)});
    });
    words.sort((w1, w2) => w2.count - w1.count);

    const wordsMessage = words.reduce((message, word) => {
        return `${message}${word.word} (${word.count})\r\n`;
    }, '');
    const message = `SIZE = ${dictionary.size}\r\n${wordsMessage}`;
    await fs.writeFile(output, message);
    console.log('DONE');
}

function printDictionaryStats(dictionary) {
    let stat = new Map();
    const addStat = (count) => stat.set(count, stat.has(count) ? stat.get(count) + 1 : 1);
    dictionary.words.forEach((word) => addStat(dictionary.count(word)));

    stat = new Map([...stat.entries()].sort((e1, e2) => e2[0] - e1[0]));
    console.log('DICTIONARY STATS');
    console.log(stat);
}
