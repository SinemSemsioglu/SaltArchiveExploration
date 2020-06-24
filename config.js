config = {
    port: 8080,
    csv: {
        fields: ["handle", "dc.language", "dc.type", "dc.coverage.spatial", "dc.coverage.temporal", "dc.note", "dc.note.internal"],
        years: [1800, 1850, 1900, 1920, 1930, 1940, 1950, 1960, 1970, 1980, 1990, 2000]
    }
};

module.exports = {
    config
};