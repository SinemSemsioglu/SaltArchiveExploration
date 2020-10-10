const fs = require('fs');
const path = require('path');
const directoryPath = path.join(__dirname, '../data');
const numNodes = 60;

const readScoresFile = (id) => {
    let rawscores = fs.readFileSync(directoryPath + '/score_data/scores_' + id + '.json');
    return  JSON.parse(rawscores);
}

const readNodesFile = () => {
    let rawnodes = fs.readFileSync(directoryPath + '/nodes.json');
    return JSON.parse(rawnodes);
}

const changeWeights = async (req, res) => {
    let weights = req.body.weights;
    let id = req.body.id;
    //scores.a_G, scores.a_V, scores.a_C, scores.a_T, scores.a_U
    // get original data
    let currScores = Object.assign({}, readScoresFile(id));
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
    console.log(process.memoryUsage());
    let nodes = readNodesFile();

    let sortedIds = Object.keys(allScores).sort(function(id1,id2){return allScores[id2].overall - allScores[id1].overall});
    let relevantScores = {};
    relevantScores[id] = {};
    let relevantNodes = [Object.assign({id: id}, nodes[id])];

    for(let i=0; i < numNodes; i++) {
        let childElmId = sortedIds[i];
        relevantScores[id][childElmId] = allScores[childElmId];
        relevantNodes.push(Object.assign({id: childElmId}, nodes[childElmId]));
    }
    console.log(process.memoryUsage());
    return {relevantNodes, relevantScores}
}
const getById = async(req, res) => {
    let id = req.body.id;
    let data = getData(id, readScoresFile(id));

    res.send({success: true, data: {nodes: data.relevantNodes, scores: data.relevantScores}});
}

const getRandomElements = async(req, res) => {
    let elms = [];
    let nodes = readNodesFile();

    let ids =  Object.keys(nodes)
    for (let i=0; i < req.body.numElements; i++) {
         let randId = ids[Math.round(Math.random() * ids.length)];
         elms.push(Object.assign({id: randId}, nodes[randId]))
     }

     res.send({success: true, data: {nodes: elms}});
}

module.exports = {
    getById,
    changeWeights,
    getRandomElements
}
