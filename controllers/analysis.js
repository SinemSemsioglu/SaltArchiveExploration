const analysisUtil = require('../modules/analysis');

const matchLanguageType =  (req, res) => {
   let matches = matchFields("language", req.body.keyword, "type");

    res.send({
        data: matches
    })
};

const matchTypeLanguage =  (req, res) => {
    let matches = matchFields("type", req.body.keyword, "language");

    res.send({
        data: matches
    })
};

const findCloseItem = (req, res) => {
    let field1 = req.body.field;
    let field2 = config.analysis.matchFields[field1];
    let item = analysisUtil.findCloseMatch(req.body.id, field1, field2);

    res.send({
        data: {
            item
        }
    })
};

const getRandomItem = (req, res) => {
    res.send({
        item: analysisUtil.getRandomItemEntireData()
    });
};

const matchFields = (field1, keyword, field2) => {
    let includingValues = analysisUtil.findValuesIncludingKeyword(field1, keyword);
    console.log(includingValues);
    let result =  {};
    includingValues.forEach((value) => {
       let value2 = analysisUtil.findMostIntersectingValueOtherField(field1, value, field2);
       console.log(value2);
       result[value] = value2;
    });

    return result;
};



module.exports = {
    matchLanguageType,
    matchTypeLanguage,
    findCloseItem,
    getRandomItem
};