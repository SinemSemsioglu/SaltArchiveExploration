const config = require('../config.js').config;
const util = require('./util.js');

let clusters = {};
let valFields = [];
let data= {};

const main = (_data) => {
    console.log("in analysis main function");
    data = _data;
    initClusters();
    organize();
    printDebugValues();
};

// initialization methods
const initClusters = () => {
    valFields = config.csv.fields;
    valFields.forEach((fieldKey) => {
       clusters[fieldKey] = {notDefined: []};
    });
};

// accepts flat data
const organize = () => {
    let ids = Object.keys(data);
    ids.forEach((id) => {
        let row = data[id];

        valFields.forEach((fieldKey) => {
            // check for multiple values
            // todo interesting to see which one's are multiple or not
            let val = row[fieldKey];
            if (!util.checkValid(val)) {
                clusters[fieldKey].notDefined.push(id);
            }  else {
                _val = getFieldValues(val);
                _val.forEach((val) => {
                    // todo add an if statement after adding the dc.date.issued field
                   if (clusters[fieldKey].hasOwnProperty(val)) {
                        clusters[fieldKey][val].push(id);
                    } else {
                        clusters[fieldKey][val] = [id];
                    }
                })
            }
        });
    });
};

// analysis methods
const findValuesIncludingKeyword = (field, keyword) => {
    let values = Object.keys(clusters[field]);
    return values.filter((val) => val.includes(keyword));
};

const findMostIntersectingValueOtherField = (field1, value, field2) => {
    let maxIntersection = 0;
    let mostFrequentValue = null;
    let arr1 = clusters[field1][value];
    let values = Object.keys(clusters[field2]);
    values.forEach((field2value) => {
       let arr2 = clusters[field2][field2value];
       let currIntersection = findIntersection(arr1, arr2).length;
       if (currIntersection > maxIntersection) {
           maxIntersection = currIntersection;
           mostFrequentValue = field2value;
       }
    });

    return mostFrequentValue;
};

const findCloseMatch = (id, field1, field2) => {
    let values = getFieldValues(data[id][field1]);
    let matches = findIntersectionForField(field1, values);
    console.log("field1 " + field1 + " field2: " + field2);

    // if there is still more than one item, check out the second field
    if (matches.length > 1) {
        let valuesField2 = getFieldValues(data[id][field2]);
        let matchesField2 = findIntersectionForField(field2, valuesField2);
        let intersectingMatches = findIntersection(matches, matchesField2);
        if (intersectingMatches.length > 0) {
            matches = intersectingMatches;
        }
    }

    return getRandomItem(matches);
};

const getRandomItemEntireData = () => {
    let ids = Object.keys(data);
    return getRandomItem(ids);
};


// helper methods
const findIntersection = (arr1, arr2) => {
    // todo make keyword search case-insensitive
   return  arr1.filter(value => arr2.includes(value));
};

const findIntersectionForField = (field, values) => {
    let matches = [];
    // first find the intersection of all values for the given field, stop if there is only one item found
    // we need to be careful about getting the same item as well
    values.forEach((value) => {
        let currMatches = clusters[field][value];
        if (currMatches.length > 1) {
            let intersectingMatches = findIntersection(matches, currMatches);
            if (intersectingMatches.length > 0) {
                matches = intersectingMatches;
            } else {
                matches = currMatches;
            }
        }
    });

    return matches;
};

const getFieldValues = (val) => {
    let _val = String(val);
    let vals = _val.split("; ");
    // todo move this empty & null check to util
    return vals.filter((val) => util.checkValid(val));
};

const getRandomItem = (idsList) => {
    let randomIndex = Math.floor(Math.random() * idsList.length);
    return data[idsList[randomIndex]];
};

const printDebugValues = () => {
    valFields.forEach((fieldKey) => {
        console.log("number of unique values for " + fieldKey + " are " + Object.keys(clusters[fieldKey]).length);
    });
};

module.exports = {
    main,
    findMostIntersectingValueOtherField,
    findValuesIncludingKeyword,
    findCloseMatch,
    getRandomItemEntireData
};