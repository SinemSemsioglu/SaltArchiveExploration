const fs = require('fs');
const {spawn} = require("child_process");
const scores = require("../data/scores.json");
const nodes = require("../data/nodes.json");
const config = require("../config").config;

const run = async (req, res) => {
    console.log(req.body);
    let scores = req.body;
    const python = spawn('python', ['score_similarity.py', scores.a_G, scores.a_V, scores.a_C, scores.a_T, scores.a_U]);
    python.stdout.on('data', (data) => {
       console.log("from python: " + data.toString());
    });
    python.on('close', (code) => {
        console.log("python process ended with code " + code)
        // todo check for successful code
        if(code == 0) {
            // todo change the location of py scripts
            // read json data
            let rawdata = fs.readFileSync('similarity_scores.json');
            let scores = JSON.parse(rawdata);
            res.send({success: true, scores});
        } else {
            res.send({success: false})
        }

    })
}

const changeWeights = async (req, res) => {
    let weights = req.body.weights;
    let id = req.body.id;
    //scores.a_G, scores.a_V, scores.a_C, scores.a_T, scores.a_U
    // get original data
    let currScores = Object.assign({}, scores[id]);
    // recalculate the overall score
    let ids = Object.keys(currScores);

    ids.forEach((id) => {
        let scoreObj = currScores[id];
        currScores.overall = weights.a_G * scoreObj.search_res + weights.a_V * scoreObj.vis_similarity + weights.a_C * scoreObj.object_match + weights.a_T * scoreObj.salt_metadata;
    });

    let data = getData(id, currScores);
    res.send({success: true, data: {nodes: data.relevantNodes, scores: data.relevantScores}});
}

const getData = (id, allScores) => {
    let sortedIds = Object.keys(allScores).sort(function(id1,id2){return allScores[id2].overall - allScores[id1].overall});
    let relevantScores = {};
    relevantScores[id] = {};
    let relevantNodes = [Object.assign({id: id}, nodes[id])];

    for(let i=0; i < config.numNodes; i++) {
        let childElmId = sortedIds[i];
        relevantScores[id][childElmId] = allScores[childElmId];
        relevantNodes.push(Object.assign({id: childElmId}, nodes[childElmId]));
    }

    return {relevantNodes, relevantScores}
}
const getById = async(req, res) => {
    let id = req.body.id;
    let data = getData(id, scores[id]);

    res.send({success: true, data: {nodes: data.relevantNodes, scores: data.relevantScores}});
}

const getRandomElements = async(req, res) => {
    let elms = [];
    let ids =  Object.keys(nodes)
    for (let i=0; i < req.body.numElements; i++) {
         let randId = ids[Math.round(Math.random() * ids.length)];
         elms.push(Object.assign({id: randId}, nodes[randId]))
     }

     res.send({success: true, data: {nodes: elms}});
}

module.exports = {
    run,
    getById,
    changeWeights,
    getRandomElements
}
