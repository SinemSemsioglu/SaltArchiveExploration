const fs = require('fs');
const {spawn} = require("child_process");

const run = async (req, res) => {
    console.log(req.body);
    let scores = req.body;
    const python = spawn('C:/Python38/python', ['score_similarity.py', scores.a_G, scores.a_V, scores.a_C, scores.a_T, scores.a_U]);
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

module.exports = {
    run
}
