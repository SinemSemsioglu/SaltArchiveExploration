const express = require('express');
const router = express.Router();
const analysis = require('./controllers/analysis');

router.post('/matchLanguageType', analysis.matchLanguageType);
router.post('/matchTypeLanguage', analysis.matchTypeLanguage);
router.post('/findMatch', analysis.findCloseItem);
router.post('/getRandomItem', analysis.getRandomItem);

module.exports = router;
