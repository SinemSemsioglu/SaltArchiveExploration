const express = require('express');
const router = express.Router();
const score = require('./controllers/score');

router.post("/changeWeights", score.changeWeights)
router.post("/getRandomElements", score.getRandomElements)
router.post("/getById", score.getById)

module.exports = router;
