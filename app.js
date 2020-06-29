'use strict' // todo: write use strict for all of the files here!!!!!!!!!!!!!!!!!!!!!
const express = require('express');
const routes = require('./routes.js');
const bodyParser = require('body-parser');
const config = require('./config.js').config;

const dirModule = require('./modules/file');
const analysisModule = require('./modules/analysis');

let app = express();

// REQUEST SETTINGS
app.use(bodyParser.urlencoded({
    limit: '5mb',
    parameterLimit: 100000,
    extended: false
}));
app.use(bodyParser.json({
    limit: '5mb'
}));

// ROUTING
app.use('/', routes); // requests are handled here
app.use(express.static('public')); // static pages are served
app.get('/', function (req, res) {
    res.send("Hello there :)");
});

// START THE SERVER
let server = app.listen(config.port, () => {
    console.log('Listening on ' + config.port);
    console.log("Server initialization successful!")
});

const analyzeData = async() => {
    console.log("in analyze data function");
    let data = await dirModule.getFilesFlat();
    //console.log(data);
    analysisModule.main(data);
};

analyzeData();



