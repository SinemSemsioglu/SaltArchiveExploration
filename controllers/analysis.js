const analysisUtil = require('../modules/analysis');

const matchLanguageType =  (req, res) => {
   let matches = matchFields("dc.language", req.body.keyword, "dc.type");

    res.send({
        data: matches
    })
};

const matchTypeLanguage =  (req, res) => {
    let matches = matchFields("dc.type", req.body.keyword, "dc.language");

    res.send({
        data: matches
    })
};

const matchFields = (field1, keyword, field2) => {
    let includingValues = analysisUtil.findValuesIncludingKeyword(field1, keyword);
    let result =  {};
    includingValues.forEach((value) => {
       let value2 = analysisUtil.findMostIntersectingValueOtherField(field1, value, field2);
       result[value] = value2;
    });

    return result;
};

module.exports = {
    matchLanguageType,
    matchTypeLanguage
};