const path = require('path');
const fs = require('fs');
const csv = require('csv-parser');
const moment = require('moment');
const config = require('../config.js').config;

//joining path of directory
const directoryPath = path.join(__dirname, '../data/test_data');

const getFilesCategorical = async() => {
    let categories = fs.readdirSync(directoryPath);
    let dataObj = {
        path: directoryPath,
        categoryKeys: categories
    };

    categories.forEach((category) => {
        let categoryPath = path.join(directoryPath, category);

        subcategories = fs.readdirSync(categoryPath);
        dataObj[category] = {
            path: categoryPath,
            subcategoryKeys: subcategories
        };

        subcategories.forEach(async (subcategory) => {
            let subcategoryPath = path.join(categoryPath, subcategory);
            csvFiles = fs.readdirSync(subcategoryPath);

            dataObj[category][subcategory] = {
                path: subcategoryPath,
                files: csvFiles //currently there is only one file so this might be unnecessary
            };

            await csvFiles.forEach(async (file) => {
                let filePath = path.join(subcategoryPath, file);
                dataObj[category][subcategory][file] = {
                    path: file,
                    data: await readCSV(filePath)
                }
            });
        });
    });

    return data;
};

const getFilesFlat = async() => {
    console.log("in get files function");
    let rows = [];
    let categories = fs.readdirSync(directoryPath);
    try {
        await asyncForEach(categories, async(category) => {
            let categoryPath = path.join(directoryPath, category);

            let subcategories = fs.readdirSync(categoryPath);

            await asyncForEach(subcategories, async (subcategory) => {
                let subcategoryPath = path.join(categoryPath, subcategory);
                let csvFiles = fs.readdirSync(subcategoryPath);

                await asyncForEach(csvFiles, async (file) => {
                    let filePath = path.join(subcategoryPath, file);
                    let _rows = await readCSV(filePath);
                    Object.assign(rows, _rows);
                    //rows = [...rows, ..._rows];
                    /*row.category = category;
                    row.subcategory = subcategory;
                    rows.push(row);*/
                });
            });
        });
    } catch(err) {
        console.log(err);
    }

    console.log("returning from file function, length of rows is " + rows.length);
    return rows;
};

const readCSV = async (filePath) => {
    let rows = {};
    let dataId = [config.fieldConversion.serverToData.id];
    return new Promise((resolve, reject) => {
        fs.createReadStream(filePath)
            .pipe(csv())
            .on('data', (row) => {
                let _row = {};
                config.csv.fields.forEach((fieldKey) => {
                    let val = row[config.fieldConversion.serverToData[fieldKey]];
                    if (fieldKey == "issue_date") val = clusterYears(val);
                    _row[fieldKey] = val;
                });
                rows[row[dataId]] = _row;
            })
            .on('end', () => {
                //console.log('CSV file successfully processed');
                resolve(rows);
            })
            .on('error', (err) => {
                reject(err);
            });
    })

};


const clusterYears = (dateString) => {
    let year = "";
    if (dateString !== "") {
        // todo figure out potential date formats and try them out here
        year = moment(dateString).year();
    }
    //console.log("in cluster years func: " + year);
    return year;
};

async function asyncForEach(array, callback) {
    for (let index = 0; index < array.length; index++) {
        await callback(array[index], index, array);
    }
}

module.exports = {
    getFilesFlat,
    getFilesCategorical
};
