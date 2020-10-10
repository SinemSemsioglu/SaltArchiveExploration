let height = 600
let width = 1200 // todo this might need to be changed

let nodes;
let scores;

let koVals;

let rootId = '80225';
let squareSize = 60;
let lastChangeRequest = moment();
let visitedNodes = ko.observableArray([]);

radiusOffset = 150;
baseRadius = radiusOffset * 3 / 2; // 1 for radius of the root elm's circle 1/2 for half of the extra radius of each circle

const scoreComponents = ['vis_similarity', 'object_match', 'search_res', 'salt_metadata'];

const thresholds = {
    vis_similarity: 0.5,
    object_match: 1,
    search_res: 5,
    salt_metadata: 0.05,
    overall: {
        zero: 0.66,
        one: 0.33,
        two: 0
    }
}

const main = async() => {
    await getData();
    initializePhotoDefs();
    initializeGraph();
    initClick();
    initKO();
}

// graph related functions
const initializePhotoDefs = () => {
    var svg7 = d3.select("#demo7");
    svg7.append("defs")
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
}

const initializeGraph = () => {
    $("#nodes").empty();
    $("#links").empty();

    let data = scores[rootId]
    var root = d3.hierarchy(data)
        .sort((a,b) => b.height - a.height || a.data.name.localeCompare(b.data.name));


    var treeLayout = d3.cluster()
        .size([360, baseRadius]);

    treeLayout(root);

    var svg7 = d3.select("#demo7");

    const deg2rad = (deg) => {
        return deg * (Math.PI / 180)
    }

    // draw nodes
    svg7.select('g#nodes')
        .selectAll('circle.node')
        .data(root.descendants())
        .enter()
        .append('rect')
        .attr("class", d => d.data.name + " node data-point")
        .attr("fill", d => "url(#" + d.data.name + "_pattern)")
        .attr("width", squareSize)
        .attr("height", squareSize)
        .attr("x", d=> (d.y + (d.data.depth * radiusOffset)) * Math.cos(deg2rad(d.x))- squareSize/2)
        .attr("y", d=> (d.y + (d.data.depth * radiusOffset)) * Math.sin(deg2rad(d.x))- squareSize/2)
        //.attr('x', -30)
        //.attr('y', d => -d.y - 30)
        .attr('stroke', "darkgray")
        .attr('stroke-width', 1)
        //.attr("transform", d => `rotate(${d.x + index * 30} , 0, 0)`);

    /*
    var lineGen = d3.lineRadial()
        .angle(d => deg2rad(d.x) + Math.PI/2) // lines have 90 deg offset i.c to nodes, why?
        .radius(d => d.y + (d.data.depth * radiusOffset));

    // draw links
    svg7.select('g#links')
        .selectAll('path.link')
        .data(root.links())
        .enter()
        .append("path")
        .classed('link', true)
        .attr('stroke', "darkgray")
        .attr('stroke-width', 2)
        //.attr("d", linkGen);
        .attr("d", (d) => lineGen([d.target, d.source]));*/

    $("." + rootId).addClass("root-node");
};


// interaction related functions
const toggleLinkVisibility = () => {
    $(".link").toggle();
}

let currFilterToggle = null;

const toggleHighlightedNodes = (scoreType, disabled) => {
    let threshold = thresholds[scoreType];
    let {valid, invalid} = filterByProp(scores[rootId].children, threshold, scoreType, 'name');

    if (disabled()) {
        invalid.forEach((elm) => {
            $("." + elm).removeClass('highlight');
            $("." + elm).addClass('fade');
        });

        valid.forEach((elm) => {
            $("." + elm).removeClass('fade');
            $("." + elm).addClass('highlight'); // curr useless
        });

        if (currFilterToggle != null) currFilterToggle(true);
        currFilterToggle = disabled;
    } else {
        invalid.forEach((elm) => {
            $("." + elm).removeClass('fade');
        });

        valid.forEach((elm) => {
            $("." + elm).removeClass('highlight'); // curr useless
        });

        currFilterToggle = null;
    }

    disabled(!disabled());
}

let connectedId = null;

const initClick = () => {
    $(".data-point").not(".root-node").click((event)=> {
        let id = event.target.classList[0];
        connectedId = id;
        $($('.root-img')[0]).attr('src', findByProp(nodes, rootId, 'id','url'));
        $($('.connected-img')[0]).attr('src', findByProp(nodes, id, 'id','url'));
        $('#connectionInfoModal').modal('show')

        let scoresObj = findByProp(scores[rootId].children, id, 'name');
        $('.connection').find('.overall-score').text(Math.round(scoresObj.overall * 100) + '%', 'name')

        // todo can also use the scoreInfo comp?
        scoreComponents.forEach((scoreType) => {
            let scoreLine = $('.connection-line.' + scoreType + '-bg');
            if (scoresObj[scoreType]>= thresholds[scoreType]) scoreLine.show();
            else scoreLine.hide();
        })

        let percentVal = Math.round(scoresObj.vis_similarity * 100) + '%';
        $('.scale-indicator').height(percentVal);
        $('.scale-text').text(percentVal);

        // todo process other score info here
    })
}

// todo assuming we already have the data
const centerConnectedImage = () => {
    if (connectedId != null) {
        $('#connectionInfoModal').modal('hide');
        koVals.visitedNodes.push(findByProp(nodes, rootId, 'id','url'));
        rootId = connectedId;
        initializeGraph();
        initClick();
        connectedId = null;

    }
}

let zoomLevel = ko.observable(100);

const zoom = (deltaLevel) => {
    zoomLevel(zoomLevel() + deltaLevel)

    // Set page zoom via CSS
    $('.main-content').css({
        transform: 'scale(' + (zoomLevel() / 100) + ')', // set zoom
        transformOrigin: '50% 50%' // set transform scale base
    });

    /* Adjust page to zoom width
    if (zoomLevel() > 100) $('body').css({
        width: (zoomLevel() * 1.2) + '%'
    });
    else $('body').css({
        width: '100%'
    });*/
}

const initKO = () => {
    let scoreInfo = [
        {
            scoreType: "search_res",
            scoreCode: "a_G",
            scoreWeight: ko.observable(25), // todo later on get/update this via backend
            scoreName: "Knowledge API",
            scoreScale: "binary",
            disabled: ko.observable(true),
            scoreLocked: ko.observable(false)
        },
        {
            scoreType: "object_match",
            scoreCode: "a_C",
            scoreWeight: ko.observable(25), // todo later on get/update this via backend
            scoreName: "Object Recognition",
            scoreScale: "binary",
            disabled: ko.observable(true),
            scoreLocked: ko.observable(false)
        },
        {
            scoreType: "vis_similarity",
            scoreCode: "a_V",
            scoreWeight: ko.observable(25), // todo later on get/update this via backend
            scoreName: "Visual Similarity",
            scoreScale: "continuous",
            disabled: ko.observable(true),
            scoreLocked: ko.observable(false)
        },
        {
            scoreType: "salt_metadata",
            scoreCode: "a_T",
            scoreWeight: ko.observable(25), // todo later on get/update this via backend
            scoreName: "Metadata Tagging",
            scoreScale: "discrete",
            disabled: ko.observable(true),
            scoreLocked: ko.observable(false),
        }
    ]

    scoreInfo.forEach((scoreObj) => {
        scoreObj.scoreWeight.subscribe((newVal) => {
            let code = scoreObj.scoreCode;
            calculateNewWeights(code);
        });
        scoreObj.scoreWeight.extend({ rateLimit: 50 });
    });

    koVals =
        {
            scoreInfo,
            toggleHighlightedNodes,
            getNewScores,
            centerConnectedImage,
            visitedNodes,
            zoomLevel,
            zoom,
            infoActive: ko.observable(false)
        };

    ko.applyBindings(koVals);
}


// data related functions
const getData = async () => {
    try {
        let nodeData = await $.getJSON("./data/sample_data.json");
        nodes = nodeData.nodes;
        parseScoresFile(await $.getJSON("./data/similarity_scores.json"));
    } catch(err) {
        alert(err)
    }
}

// todo i'm sure there is a better wayS
const calculateNewWeights = (changedScore) => {
    let totalWeight = 0;
    let possibleScore = 100;
    let numChangeableScores = 0;

    koVals.scoreInfo.forEach((scoreObj) => {
        if (scoreObj.scoreLocked()) {
            possibleScore -= 25;
        } else {
            totalWeight += parseFloat(scoreObj.scoreWeight());
            numChangeableScores++;
        }
    });

    let overdrive = possibleScore - totalWeight;

    koVals.scoreInfo.forEach((scoreObj) => {
        if (scoreObj.scoreCode != changedScore && !scoreObj.scoreLocked()) {
            scoreObj.scoreWeight(parseFloat(scoreObj.scoreWeight()) + overdrive/numChangeableScores);
        }
    });

    if (!lastChangeRequest || (lastChangeRequest && moment().diff(lastChangeRequest) > 500)) {
        lastChangeRequest = moment();
        getNewScores();
    }
}

const getNewScores = () => {
    let scoreData = {
        a_U: 0 // for now we don't consider user score
    };

    koVals.scoreInfo.forEach((scoreObj) => {
        scoreData[scoreObj.scoreCode] = scoreObj.scoreWeight()/100;
    })

    $.ajax({
        type: "POST",
        url: "/changeWeights",
        data: scoreData,
        success: async (resp) => {
            if (resp.success) {
                // todo get json for new scores
                // todo init graph again

                parseScoresFile(resp.scores);
                initializeGraph();
                initClick();
            }
        },
        dataType: "json"
    });
}

const parseScoresFile = (file) => {
    scores = {};

    Object.keys(file).forEach((rootId) => {
        scores[rootId] = {
            name: rootId,
            depth: 0,
            children: []
        }

        Object.keys(file[rootId]).forEach((childId) => {
            let scoreObj = file[rootId][childId];
            scoreObj.name = childId;

            let depth;
            if(scoreObj.overall > thresholds.overall.zero) depth = 0;
            else if (scoreObj.overall >= thresholds.overall.one) depth = 1;
            else depth = 2;
            scoreObj.depth = depth;
            scores[rootId].children.push(scoreObj);
        });
    });
}

// util functions
const findByProp = (arr, val, searchProp, returnProp) => {
    let elm = arr.find((elm) => elm[searchProp] == val);
    if (returnProp ) return elm[returnProp];
    else return elm;
}

const filterByProp = (arr, filterVal, filterProp, returnProp) => {
    let valid = arr.filter((elm) => elm[filterProp] >= filterVal);
    let invalid = arr.filter((elm) => elm[filterProp] < filterVal);
    if (returnProp) {
        valid = valid.map(elm => elm[returnProp]);
        invalid = invalid.map(elm => elm[returnProp]);
    }
    return {valid, invalid};
}

main();