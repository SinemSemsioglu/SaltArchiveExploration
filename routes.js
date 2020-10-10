const express = require('express');
const router = express.Router();
const analysis = require('./controllers/analysis');
const score = require('./controllers/score');

router.post('/matchLanguageType', analysis.matchLanguageType);
router.post('/matchTypeLanguage', analysis.matchTypeLanguage);
router.post('/findMatch', analysis.findCloseItem);
router.post('/getRandomItem', analysis.getRandomItem);
router.post("/changeWeights", score.changeWeights)
router.post("/getRandomElements", score.getRandomElements)
router.post("/getById", score.getById)

module.exports = router;
