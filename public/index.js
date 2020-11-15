let height = 600
let width = 1200 // todo this might need to be changed

let nodes;
let scores;

let koVals;
let smallBreakpoint = 576;
let rootId = '80225';
let squareSize = 60;
let lastChangeRequest = moment();
let visitedNodes = ko.observableArray([]);
let starterNodes = ko.observableArray([]);
let infoLabels = ["Title", "Description", "Created by", "Date Issued", "Topics", "Medium", "Location", "Format"];
let infoActive = ko.observable(false);
let pageInit = ko.observable(false);
let currentConnection = {};

let currFilterToggle = null;
radiusOffset = 150;
baseRadius = radiusOffset * 3 / 2; // 1 for radius of the root elm's circle 1/2 for half of the extra radius of each circle

const scoreComponents = ['vis_similarity', 'object_match', 'search_res', 'salt_metadata'];

const thresholds = {
    vis_similarity: 0.5,
    object_match: 0.3,
    search_res: 0.1,
    salt_metadata: 0.2,
    overall: {
        zero: 0.75,
        one: 0.50,
        two: 0.25,
        three: 0,
    }
}

const colorScoreMap = {
    "search_res": "#A64AC9",
    "vis_similarity": "#17E9E0",
    "object_match": "#FCCD05",
    "salt_metadata": "#E91750",
    "overall": "#9c1a27"
}

const scoreAngleOffsets = {
    "search_res": -2,
    "vis_similarity": -1,
    "object_match": 1,
    "salt_metadata": 2
}

let rootInfo;
let connectedInfo;

const initPage = () => {
    rootInfo = initInfoStructure();
    connectedInfo = initInfoStructure();
    initKO();
    $("#initModal").modal("show");
}

const initJourney = () => {
    getRandomElms();
}

const startJourney = (id) => {
   getDataById(id, () => {
       $("#startModal").modal('hide')
       pageInit(true);
   });
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
        .attr('xlink:href', d => d.thumb_url)
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

    var lineGen = d3.lineRadial()
        .angle(d => deg2rad(d.x + (d.offset ? d.offset : 0)) + Math.PI/2) // lines have 90 deg offset i.c to nodes, why?
        .radius(d => d.y + (d.data.depth * radiusOffset));

    // draw links
    let links = root.links();

/*    svg7.select('g#links')
        .selectAll('path.link')
        .data(links)
        .enter()
        .append("path")
        .attr("class", (d) => "link " + d.target.data.name + "-link")
        .attr('stroke', "darkgray")
        .attr('stroke-width', (d) => d.target.data.overall)
        .attr("d", (d) => lineGen([d.target, d.source]));*/

    links.forEach((link) => {
        scoreComponents.forEach((scoreType) => {
            let currScore = link.target.data[scoreType];
            if (currScore >= thresholds[scoreType]) {
                svg7.select('g#links')
                    .append("path")
                    .attr("class", "link " + scoreType + "-link " + link.target.data.name + "-link")
                    .attr('stroke', colorScoreMap[scoreType])
                    .attr('stroke-width', currScore)
                    .attr("d", lineGen([Object.assign({offset: scoreAngleOffsets[scoreType]}, link.target), link.source]));
            }
        })
    });


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


    $("." + rootId).addClass("root-node");
};


// interaction related functions
const resetToggles = () => {
    koVals.scoreInfo.forEach((score) => {
        if(score.scoreType == "overall") score.disabled(false);
        else score.disabled(true);
    });
}

const toggleHighlightedNodes = (scoreType, disabled) => {
    let threshold;
    if (scoreType == 'overall') threshold = thresholds.overall.three; // the outermost
    else threshold = thresholds[scoreType];

    let {valid, invalid} = filterByProp(scores[rootId].children, threshold, scoreType, 'name');

    if (disabled()) {
        invalid.forEach((elm) => {
            $("." + elm).removeClass('highlight');
            $("." + elm).addClass('fade');
            $("." + elm + "-link").hide();
        });

        valid.forEach((elm) => {
            $("." + elm).removeClass('fade');
            $("." + elm).addClass('highlight'); // curr useless
            $("." + elm + "-link").show();
        });

        if (currFilterToggle != null) currFilterToggle(true);
        currFilterToggle = disabled;

        if(scoreType == 'overall') {
            scoreComponents.forEach((type) => {
                $("." + type+ "-link").show();
            })
        } else {
            scoreComponents.forEach((type) => {
                if (type == scoreType) $("." + type+ "-link").show();
                else $("." + type+ "-link").hide();
            })
        }
    } else {
        // make everything faded as the default case
        invalid.forEach((elm) => {
            //$("." + elm).removeClass('fade');
        });

        valid.forEach((elm) => {
            $("." + elm).removeClass('highlight'); // curr useless
            $("." + elm).addClass('fade');
            $("." + elm + "-link").hide();
        });

        currFilterToggle = null;
        scoreComponents.forEach((type) => {
            $("." + type+ "-link").hide();
        })
    }

    disabled(!disabled());
}

let connectedId = null;

const initClick = () => {
    $(".data-point").not(".root-node").click((event)=> {
        let id = event.target.classList[0];
        connectedId = id;

        // set metadata info for the selected node
        setInfo(findByProp(nodes, id, 'id'), false);

        let scoresObj = findByProp(scores[rootId].children, id, 'name');

        // todo can also use the scoreInfo comp?
        scoreComponents.forEach((scoreType) => {
            let score = scoresObj[scoreType];
            currentConnection[scoreType].aboveThreshold((score >= thresholds[scoreType]))
            currentConnection[scoreType].scoreText(Math.round(score * 100) + '%');
        })
        currentConnection.overallScore(Math.round(scoresObj.overall * 100) + '%');
        currentConnection.object_match.keywords(scoresObj.matched_objects);
        currentConnection.search_res.keywords(scoresObj.search_keywords);
        currentConnection.salt_metadata.keywords(scoresObj.metadata_keywords);


        $('[data-toggle="tooltip"]').tooltip()
        $('#connectionInfoModal').modal('show')
    })

    $(".root-node").click(() => {
        $('#nodeInfoModal').modal('show');
    });
}

// todo assuming we already have the data
const centerConnectedImage = () => {
    if (connectedId != null) {
        getDataById(connectedId, () => {
            $('#connectionInfoModal').modal('hide');
            visitedNodes.push(findByProp(nodes, rootId, 'id','thumb_url'));
            rootId = connectedId;
            connectedId = null;
        });
    }
}

let zoomLevel = ko.observable(100);

const zoom = (deltaLevel) => {
    // Set page zoom via CSS
    $('.main-content').removeClass('zoom-' + zoomLevel())
    zoomLevel(zoomLevel() + deltaLevel)
    $('.main-content').addClass('zoom-' + zoomLevel());
}

const initKO = () => {
    let scoreInfo = [
        {
            scoreType: "overall",
            scoreName: "Overall Score",
            disabled: ko.observable(false)
        },
        {
            scoreType: "search_res",
            scoreCode: "a_G",
            scoreWeight: ko.observable(25), // todo later on get/update this via backend
            scoreName: "Knowledge API",
            scoreScale: "binary",
            disabled: ko.observable(true),
            scoreLocked: ko.observable(false),
            scoreDetail: "Their external contextual similarity as measured by comparison of text found in knowledge bases such as Wikipedia"
        },
        {
            scoreType: "object_match",
            scoreCode: "a_C",
            scoreWeight: ko.observable(25), // todo later on get/update this via backend
            scoreName: "Object Recognition",
            scoreScale: "binary",
            disabled: ko.observable(true),
            scoreLocked: ko.observable(false),
            scoreDetail: "Similarity of objects contained in those images"
        },
        {
            scoreType: "vis_similarity",
            scoreCode: "a_V",
            scoreWeight: ko.observable(25), // todo later on get/update this via backend
            scoreName: "Visual Similarity",
            scoreScale: "continuous",
            disabled: ko.observable(true),
            scoreLocked: ko.observable(false),
            scoreDetail: "Visual similarity of archive items' images such as color or layout"
        },
        {
            scoreType: "salt_metadata",
            scoreCode: "a_T",
            scoreWeight: ko.observable(25), // todo later on get/update this via backend
            scoreName: "Salt Data Tags",
            scoreScale: "discrete",
            disabled: ko.observable(true),
            scoreLocked: ko.observable(false),
            scoreDetail: "Similarity of these items' metadata tags in salt archives."
        }
    ]

    scoreInfo.forEach((scoreObj) => {
        if (scoreObj.scoreWeight) {
            scoreObj.scoreWeight.subscribe((newVal) => {
                let code = scoreObj.scoreCode;
                calculateNewWeights(code);
            });
            scoreObj.scoreWeight.extend({ rateLimit: 50 });
        }
    });


    currentConnection = {
        overallScore: ko.observable('0%')
    };

    scoreComponents.forEach((scoreType) => {
        currentConnection[scoreType] = {
            aboveThreshold: ko.observable(false),
            scoreText: ko.observable('0%'),
            keywords: ko.observableArray([])
        }
    })

    currFilterToggle = scoreInfo[0].disabled;

    koVals =
        {
            scoreInfo,
            toggleHighlightedNodes,
            getNewScores,
            centerConnectedImage,
            currentConnection,
            visitedNodes,
            zoomLevel,
            zoom,
            infoActive,
            starterNodes,
            startJourney,
            initJourney,
            rootInfo,
            connectedInfo,
            pageInit
        };

    ko.applyBindings(koVals);
}

const getDataById = (id, extracallback) => {
    $.ajax({
        type: "POST",
        url: "/getById",
        data: {id},
        success: async (resp) => {
            if (resp.success) {
                rootId = id;
                nodes = resp.data.nodes;
                setInfo(findByProp(nodes, rootId, 'id'), true);
                parseScoresFile(resp.data.scores);
                initializePhotoDefs();
                initializeGraph();
                initClick();
                resetToggles();
                extracallback();
            }
        },
        dataType: "json"
    });

}

const getRandomElms = async () => {
    $.ajax({
        type: "POST",
        url: "/getRandomElements",
        data: {numElements: 5},
        success: async (resp) => {
            if (resp.success) {

                for (let i =0; i < 5; i++) {
                    starterNodes(resp.data.nodes);
                }

                $("#initModal").modal('hide');
                $("#startModal").modal('show');
            }
        },
        dataType: "json"
    });
}

// todo i'm sure there is a better way
const calculateNewWeights = (changedScore) => {
    let totalWeight = 0;
    let possibleScore = 100;
    let numChangeableScores = 0;

    koVals.scoreInfo.forEach((scoreObj) => {
        if (scoreObj.scoreType !== 'overall') {
            if (scoreObj.scoreLocked()) {
                possibleScore -= 25;
            } else {
                totalWeight += parseFloat(scoreObj.scoreWeight());
                numChangeableScores++;
            }
        }
    });

    let overdrive = possibleScore - totalWeight;

    koVals.scoreInfo.forEach((scoreObj) => {
        if (scoreObj.scoreType !== 'overall') {
            if (scoreObj.scoreCode != changedScore && !scoreObj.scoreLocked()) {
                scoreObj.scoreWeight(parseFloat(scoreObj.scoreWeight()) + overdrive/(numChangeableScores-1));
            }
        }
    });

    if (!lastChangeRequest || (lastChangeRequest && moment().diff(lastChangeRequest) > 500)) {
        lastChangeRequest = moment();
        getNewScores();
    }
}

const getNewScores = () => {
    let scoreData = {};

    koVals.scoreInfo.forEach((scoreObj) => {
        if (scoreObj.scoreType !== 'overall') scoreData[scoreObj.scoreCode] = scoreObj.scoreWeight()/100;
    })

    $.ajax({
        type: "POST",
        url: "/changeWeights",
        contentType: "application/json",
        data: JSON.stringify({id: rootId, weights: scoreData}),
        success: async (resp) => {
            if (resp.success) {
                nodes = resp.data.nodes;
                setInfo(findByProp(nodes, rootId, 'id'), true);
                parseScoresFile(resp.data.scores);
                initializePhotoDefs();
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
            else if (scoreObj.overall >= thresholds.overall.two) depth = 2;
            else depth = 3;
            scoreObj.depth = depth;
            scores[rootId].children.push(scoreObj);
        });
    });
}

// util functions
const setInfo = (newInfo, isRoot) => {
    let infoObj = isRoot? rootInfo : connectedInfo;
    infoObj.thumb_url(newInfo.thumb_url);
    infoObj.salt_url(newInfo.salt_url);
    infoLabels.forEach((key) => {
        key = key.toLowerCase();
        infoObj.metadata[key].value.fullText(newInfo[key] || "-");
        // split keywords
        let keywords = newInfo[key] ? newInfo[key].split(',') : [];
        // todo this may be removed from both the data structure and here
        // split keyword within itself as that is the format of the shared keywords data
        // then flatten the array and trim the whitespace at the beggining and end of the words
        infoObj.metadata[key].value.keywords( keywords.map(keyword => keyword.split('-')).flat().map(keyword => keyword.trim()));
    })
}

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

const initInfoStructure = () => {
    let infoObj = {
        "thumb_url": ko.observable(""),
        "salt_url": ko.observable(""),
        metadata: {}
    };

    infoLabels.forEach((label) => {
        infoObj.metadata[label.toLowerCase()] = {
            label: label,
            value: {
                fullText: ko.observable(""),
                keywords: ko.observableArray([])
            }
        }
    });

    return infoObj;
};

initPage();
