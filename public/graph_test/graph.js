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

let distanceCoefficient = 10;


const main = async() => {
    await getData();
    initializeGraph();
    drawLinks(currScoreTypes);
    //initializeLinkToggles();
    initKO();
}

const random = (min, max) => {
    return Math.random * (max - min) + min;

}

const initializeLinks = (elements, scores) => {
    // for now only overall data
    let sourceIds = Object.keys(scores);
    let links = {}; //todo there will be different links array for each score type

    // initializes link arrays
    scoreTypes.forEach((scoreType) => {
        links[scoreType] = [];
    });

    sourceIds.forEach((sourceId) => {
        let targetIds  = Object.keys(scores[sourceId]);
        targetIds.forEach((targetId) => {
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
        });
    });

    elements.links = links;
    return elements;
}

const initializeGraph = () => {
    nodes = data.nodes.map(d => Object.create(d));

    // todo these need to be calculated some other way
    nodes.forEach((n) => {
        n.x = random(-width / 2, width / 2);
        n.y = random(-height / 2, height / 2);
    })

    svg = d3.create("svg")
        .attr("viewBox", [-width / 2, -height / 2, width, height]);


    nodeGraph = svg.append("g")
        .attr("stroke", "#fff")
        .attr("stroke-width", 1.5);

    nodeGraph.append("defs")
        .selectAll("pattern")
        .data(nodes)
        .join("pattern")
        .attr("id", d => d.id)
        .attr("width", 1)
        .attr("height", 1)
        .append("svg:image")
        .attr('xlink:href', d => d.url)
        .attr("width", 60)
        .attr("height", 60)
        .attr("preserveAspectRatio", "xMidYMid slice");


    node = nodeGraph.selectAll("circle")
        .data(nodes)
        .join("circle")
        .attr("fill", d => "url(#" + d.id + ")")
        .attr("r", 20)

    node.append("title")
        .text(d => d.description);

};

const getData = async () => {
    const elements = await $.getJSON("./sample_data.json");
    const scores = await $.getJSON("./similarity_scores.json");
    data = initializeLinks(elements, scores); // todo might want to change naming - initiateLinks doesn't need to return anything as it is right now
}

const toggleLinkVisibility = (scoreType) => {
    let scoreTypeIndex = currScoreTypes.indexOf(scoreType);
    if (scoreTypeIndex >= 0) {
        currScoreTypes.splice(scoreTypeIndex, 1);
    } else {
        currScoreTypes.push(scoreType);
    }

    // todo later on find a way to only remove parts of the svg and adding links at a desired location (after nodes)
    initializeGraph();
    drawLinks(currScoreTypes);
}

const initializeLinkToggles = () => {
    // init toggle buttons
    scoreTypes.forEach((scoreType) => {
        $("#" + scoreType + "_toggle" ).click( () => {
            toggleLinkVisibility(scoreType);
        })
    });
}

const drawLinks = (visibleScoreTypes) => {
    let links = [];
    let linkObjs = [];

    // todo find a way to draw links behind nodes
    visibleScoreTypes.forEach((scoreType) => {
        let currLinks = data.links[scoreType].map(d => Object.create(d));
        //console.log("here with score type "  + scoreType);

        let currLink = svg.append("g")
            .attr("stroke", colorScoreMap[scoreType])
            .attr("stroke-opacity", 0.6)
            .selectAll("line")
            .data(currLinks)
            .join("line")
            .attr("stroke-width", d => Math.sqrt(d.value));

        links = [...links, ... currLinks];
        linkObjs.push(currLink);
    });

    let simulation = d3.forceSimulation(nodes)
        .force("link", d3.forceLink(links).id(d => d.id).distance(d => d.strength * distanceCoefficient))
        .force("x", d => d3.forceX(d.x))
        .force("y", d => d3.forceY(d.y));
        //.force("center")
        //.force("charge", d3.forceManyBody())
        //.force('collision', d3.forceCollide().radius(30))

    simulation.on("tick", () => {
        linkObjs.forEach((link) => {
            link
                .attr("x1", d => d.source.x)
                .attr("y1", d => d.source.y)
                .attr("x2", d => d.target.x)
                .attr("y2", d => d.target.y);
        });

        node
            .attr("cx", d => d.x)
            .attr("cy", d => d.y);
    });


    node.call(drag(simulation));

    //invalidation.then(() => simulation.stop());

    // first remove child elements, in case the graph is being redrawn
    $("#chart").empty();
    $("#chart").append(svg.node());
}

function linkArc(d) {
    var dx = (d.target.x - d.source.x),
        dy = (d.target.y - d.source.y),
        dr = Math.sqrt(dx * dx + dy * dy),
        unevenCorrection = (d.sameUneven ? 0 : 0.5),
        arc = ((dr * d.maxSameHalf) / (d.sameIndexCorrected - unevenCorrection));

    if (d.sameMiddleLink) {
        arc = 0;
    }

    return "M" + d.source.x + "," + d.source.y + "A" + arc + "," + arc + " 0 0," + d.sameArcDirection + " " + d.target.x + "," + d.target.y;
}

drag = simulation => {

    function dragstarted(event, d) {
        if (!event.active) simulation.alphaTarget(0.3).restart();
        d.fx = d.x;
        d.fy = d.y;
    }

    function dragged(event,d) {
        d.fx = event.x;
        d.fy = event.y;
    }

    function dragended(event,d) {
        if (!event.active) simulation.alphaTarget(0);
        d.fx = null;
        d.fy = null;
    }

    return d3.drag()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended);
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

        ko.applyBindings(
            {
                scoreInfo,
                toggleLinkVisibility: (elm) => {
                    elm.disabled(!elm.disabled());
                    toggleLinkVisibility(elm.scoreType);
                }
            });
}

main();
