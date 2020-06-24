const express = require('express');
const router = express.Router();
const analysis = require('./controllers/analysis');

router.post('/matchLanguageType', analysis.matchLanguageType);
router.post('/matchTypeLanguage', analysis.matchTypeLanguage);

module.exports = router;
