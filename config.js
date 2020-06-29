config = {
    port: 8080,
    csv: {
        fields: ["id", "language", "type", "location", "temporal", "issue_date", "url", "relation", "collection"],
        years: [1800, 1850, 1900, 1920, 1930, 1940, 1950, 1960, 1970, 1980, 1990, 2000]
    },
    analysis: {
        matchFields: {
            language: ["location"],
            temporal: ["location"],
            location: ["temporal"],
            type: ["language"],
            issue_date: ["temporal"],
            relation: ["collection"],
            collection: ["relation"]
        }
    },
    fieldConversion: {
        serverToData : {
            language: "dc.language",
            temporal: "dc.coverage.temporal",
            location: "dc.coverage.spatial",
            type: "dc.type",
            id: "handle",
            issue_date: "dc.date.issued",
            url: "URL",
            relation: "dc.relation",
            collection: "dc.collection"
        },
        dataToServer: {
            "dc.language": "language",
            "dc.coverage.temporal": "temporal",
            "dc.coverage.spatial": "location",
            "dc.type": "type",
            "handle": "id",
            "dc.date.issued": "issue_date",
            "URL": "url",
            "dc.relation": "relation",
            "dc.collection": "collection"
        }

    }
};

module.exports = {
    config
};