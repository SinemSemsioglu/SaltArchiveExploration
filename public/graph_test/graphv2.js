let height = 600
let width = 1200 // todo this might need to be changed
const scoreTypes = ["vis_similarity", "object_match", "user_connection", "search_res", "salt_metadata", "overall"];
// todo add these later after fixing the scale
//"salt_metadata",
//"overall"];

//const scoreTypes = ["overall"]
const currScoreTypes = ["vis_similarity", "object_match", "user_connection", "search_res", "salt_metadata", "overall"]

const colorScoreMap = {
    "search_res": "#a1cfca",
    "vis_similarity": "#1b570a",
    "object_match": "#d66711",
    "salt_metadata": "#ebaed2",
    "user_connection": "#bae874",
    "overall": "#9c1a27"
}

let node;
let data;
let nodeGraph
let svg;
let nodes;
let scores;

let koVals;
let sourceIds;

let distanceCoefficient = 10;


const main = async() => {
    await getData();
    initializeGraph();
    initKO();
    initHoverScore();
}

const getNewScores = () => {
    $.ajax({
        type: "POST",
        url: "/changeWeights",
        data: {a_G: koVals.a_G(), a_V: koVals.a_V(), a_C: koVals.a_C(), a_T: koVals.a_T(), a_U: koVals.a_U()},
        success: async (resp) => {
            if (resp.success) {
                //elements = resp.scores;
                //data = initializeLinks(elements, scores); // todo might want to change naming - initiateLinks doesn't need to return anything as it is right now
                //initializeGraph();
                await getData();
                initializeGraph();
                initHoverScore();
            }
        },
        dataType: "json"
    });
}

const random = (min, max) => {
    return Math.random() * (max - min) + min;

}

const initHoverScore = () => {
    sourceIds.forEach((id) => {
        $("." + id).hide();

        $("#" + id).hover(() => {
            $("." + id).show();
            $("." + id + "_link").css("stroke", "black");
        }, () => {
            $("." + id).hide();
            $("." + id + "_link").css("stroke", "");
        })
    })
}

const initializeLinks = (elements, scores) => {
    // for now only overall data
    sourceIds = Object.keys(scores);
    let links = {}; //todo there will be different links array for each score type

    // initializes link arrays
    scoreTypes.forEach((scoreType) => {
        links[scoreType] = [];
    });

    let seenIds = []; // to avoid duplicates of links
    sourceIds.forEach((sourceId) => {
        let targetIds  = Object.keys(scores[sourceId]);

        targetIds.forEach((targetId) => {
            if(!seenIds.includes(targetId)) {
                let baseLinkObj = {
                    source: sourceId,
                    target: targetId,
                    value: 1
                }

                scoreTypes.forEach((scoreType) => {
                    let currScore = scores[sourceId][targetId][scoreType];
                    if (currScore > 0) {
                        links[scoreType].push( Object.assign(baseLinkObj, {strength: currScore}));
                    }
                });
            }
        });
        seenIds.push(sourceId);
    });

    elements.links = links;
    return elements;
}

const initializeGraph = () => {
    nodes = data.nodes;
    let nodeIdData = {}; // to make node data indexible by their id's

    // todo these need to be calculated some other way
    let xInt = 180;
    let yInt = 280;
    let minX = - 2 * xInt;
    let minY = - yInt/2;

    nodes.forEach((n, i) => {
        n.x = (i%5) * xInt + minX;
        n.y = Math.floor(i/5) * yInt + minY;
        if (i % 2 == 0) n.y -= 50;
        nodeIdData[n.id] = n;
    })

    svg = d3.create("svg")
        .attr("viewBox", [-width / 2, -height / 2, width, height]);


    // todo find a way to draw links behind nodes
    currScoreTypes.forEach((scoreType) => {
        let currLinks = data.links[scoreType].map(d => Object.create(d));

        let currLinkGrp = svg.append("g")
            .attr("stroke", colorScoreMap[scoreType])
            .attr("stroke-opacity", 0.6)
            .attr("class", scoreType + "_links")
            .selectAll("g.link-group")
            .data(currLinks)
            .join("g")
            .attr("class", "link-group")

        currLinkGrp.append("line")
            .attr("stroke-width", d => d.strength * 0.25)
            .attr("x1", d => nodeIdData[d.source].x)
            .attr("y1", d => nodeIdData[d.source].y)
            .attr("x2", d => nodeIdData[d.target].x)
            .attr("y2", d => nodeIdData[d.target].y)
            .attr('class', d => (d.source + "_link " + d.target + "_link"));

        if (scoreType == "overall") {
            currLinkGrp.append('svg:text')
                .attr('x', d => (nodeIdData[d.source].x + (nodeIdData[d.target].x - nodeIdData[d.source].x)/2))
                .attr('y', d => (nodeIdData[d.source].y + (nodeIdData[d.target].y - nodeIdData[d.source].y)/2))
                .attr('text-anchor', 'middle')
                .text(d => d.strength.toFixed(2))
                .attr('class', d => (d.source + " " +   d.target))
        }

    });



    nodeGraph = svg.append("g")
        .attr("stroke", "#fff")
        .attr("stroke-width", 1.5);

    nodeGraph.append("defs")
        .selectAll("pattern")
        .data(nodes)
        .join("pattern")
        .attr("id", d => d.id + "_pattern")
        .attr("width", 1)
        .attr("height", 1)
        .append("svg:image")
        .attr('xlink:href', d => d.url)
        .attr("width", 80)
        .attr("height", 80)
        .attr("preserveAspectRatio", "xMidYMid slice");


    node = nodeGraph.selectAll("circle")
        .data(nodes)
        .join("circle")
        .attr("id", d => d.id)
        .attr("fill", d => "url(#" + d.id + "_pattern)")
        .attr("r", 40)
        .attr("cx", d => d.x)
        .attr("cy", d => d.y);

    node.append("title")
        .text(d => d.description);

    // first remove child elements, in case the graph is being redrawn
    $("#chart").empty();
    $("#chart").append(svg.node());

};

const getData = async () => {
    try {
        const elements = await $.getJSON("./sample_data.json");
        scores = await $.getJSON("./similarity_scores.json");
        data = initializeLinks(elements, scores); // todo might want to change naming - initiateLinks doesn't need to return anything as it is right now
    } catch(err) {
        alert(err)
    }
}

const toggleLinkVisibility = (scoreType) => {
    $("." + scoreType + "_links").toggle();
}

const scale = d3.scaleOrdinal(d3.schemeCategory10);
color = d => scale(d.group);

const initKO = () => {
    let scoreInfo = [
        {
            scoreType: "search_res",
            scoreWeight: "20%", // todo later on get/update this via backend
            scoreName: "Knowledge API",
            scoreScale: "binary",
            disabled: ko.observable(false)
        },
        {
            scoreType: "vis_similarity",
            scoreWeight: "20%", // todo later on get/update this via backend
            scoreName: "Visual Similarity",
            scoreScale: "continuous",
            disabled: ko.observable(false)
        },
        {
            scoreType: "object_match",
            scoreWeight: "20%", // todo later on get/update this via backend
            scoreName: "Object Recognition",
            scoreScale: "binary",
            disabled: ko.observable(false)
        },
        {
            scoreType: "user_connection",
            scoreWeight: "20%", // todo later on get/update this via backend
            scoreName: "User-Made Connections",
            scoreScale: "binary",
            disabled: ko.observable(false)
        },
        {
            scoreType: "salt_metadata",
            scoreWeight: "20%", // todo later on get/update this via backend
            scoreName: "Metadata Tagging",
            scoreScale: "discrete",
            disabled: ko.observable(false)
        },
        {
            scoreType: "overall",
            scoreWeight: "100%", // todo later on get/update this via backend
            scoreName: "Overall Score",
            scoreScale: "",
            disabled: ko.observable(false)
        }
    ]

    koVals =
        {
            scoreInfo,
            toggleLinkVisibility: (elm) => {
                elm.disabled(!elm.disabled());
                toggleLinkVisibility(elm.scoreType);
            },
            getNewScores,
            a_G: ko.observable(1),
            a_C: ko.observable(1),
            a_T: ko.observable(1),
            a_U: ko.observable(1),
            a_V: ko.observable(1),
        };
    ko.applyBindings(koVals);
}

main();
