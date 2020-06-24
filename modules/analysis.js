const config = require('../config.js').config;

clusters = {};
valFields = [];

const main = (data) => {
    console.log("in analysis main function")
    initClusters();
    organize(data);
    printDebugValues();
};

const initClusters = () => {
    valFields = [...config.csv.fields];
    valFields.splice(valFields.indexOf("handle"), 1);
    valFields.forEach((fieldKey) => {
       clusters[fieldKey] = {notDefined: []};
    });
};

// accepts flat data
const organize = (data) => {
    data.forEach((row) => {
        // except handle
        valFields.forEach((fieldKey) => {

            // check for multiple values
            // todo interesting to see which one's are multiple or not
            let val = row[fieldKey];
            if (val == "" || val == null || val == undefined) {
                clusters[fieldKey].notDefined.push(row.hanle);
            }  else {
                let _val = String(val);
                _val = _val.split("; ");
                _val.forEach((val) => {
                    // todo add an if statement after adding the dc.date.issued field
                   if (clusters[fieldKey].hasOwnProperty(val)) {
                        clusters[fieldKey][val].push(row.handle);
                    } else {
                        clusters[fieldKey][val] = [row.handle];
                    }
                })
            }

        });
    });
};

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

const printDebugValues = () => {
    valFields.forEach((fieldKey) => {
        console.log("number of unique values for " + fieldKey + " are " + Object.keys(clusters[fieldKey]).length);
    });
};

const clusterYears = () => {

};

const findIntersection = (arr1, arr2) => {
   return  arr1.filter(value => arr2.includes(value));
};

module.exports = {
    main,
    findMostIntersectingValueOtherField,
    findValuesIncludingKeyword
};