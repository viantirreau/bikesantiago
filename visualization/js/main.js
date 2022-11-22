const WIDTH = 800;
const HEIGHT = 600;
const MAPBOX_ACCESS_TOKEN = 'pk.eyJ1IjoidmlhbnRpcnJlYXUiLCJhIjoiY2xhazJpOHdyMDF2MTNwbnMxbzkzMmpsayJ9.7tkQiRhR40t8P7_vXCRXfw'
const MAP_STYLE = 'viantirreau/clajy669c002414lgwdtdkz22'
const MAX_HEX_OPACITY = 0.15;
let STATION_DATA = null;
let STATION_BINS = null;
// Recursive map of day,hour,threshold,station_id,availability
let AVAILABILITY_DATA = {};
let SELECTED_DAY = 0;
let SELECTED_HOUR = 0;
let SELECTED_THRESHOLD = 1;
const WALKABLE_METERS = 512

// Do not modify these values, set the walkable radius in meters above
const METERS_PER_PIXEL = 32;
const WALKABLE_RADIUS = WALKABLE_METERS / METERS_PER_PIXEL;


// Adapted from https://observablehq.com/@d3/zoomable-map-tiles
// https://observablehq.com/@d3/zoomable-raster-vector

const svg = d3
    .select("body")
    .append("svg")
    .attr("pointer-events", "all")
    .attr("width", WIDTH)
    .attr("height", HEIGHT);

let image = svg.append("g")
    .attr("pointer-events", "none")
    .selectAll("image");

const tile = d3.tile()
    .extent([[0, 0], [WIDTH, HEIGHT]])
    .tileSize(512)
    .clampX(false);
const mapboxUrl = (x, y, z) => `https://api.mapbox.com/styles/v1/${MAP_STYLE}/tiles/${z}/${x}/${y}@2x?access_token=${MAPBOX_ACCESS_TOKEN}`;

const projection = d3.geoMercator()
    .scale(1 / (2 * Math.PI))
    .translate([0, 0]);

const hexColorMap = d3.interpolateRdYlGn;

const hexbin = d3.hexbin()
    .x(d => d.x)
    .y(d => d.y)
    .extent([[0, 0], [WIDTH, HEIGHT]])
    .radius(10);

const renderStations = () => {
    svg
        .selectAll(".station")
        .attr("cx", (d) => projection([d.lon, d.lat])[0])
        .attr("cy", (d) => projection([d.lon, d.lat])[1])
        .attr("r", 3)
        .attr("fill", "red");
}

const renderHexbin = () => {
    if (!STATION_DATA || !STATION_BINS) return;
    let redThreshold = 0.5;
    svg.selectAll(".hexagon")
        .data(STATION_BINS)
        .attr("transform", d => `translate(${d.x},${d.y})`)
        .attr("d", hexbin.hexagon())
        .attr("fill", stations => {
            let availabilities = stations.map(s => 1 - AVAILABILITY_DATA[SELECTED_DAY][SELECTED_HOUR][SELECTED_THRESHOLD][s.id]);
            // Return the product of all availabilities
            let probabilityProduct = 1 - availabilities.reduce((a, b) => a * b, 1);

            return hexColorMap((probabilityProduct - redThreshold) / (1 - redThreshold));
        })
        .attr("fill-opacity", MAX_HEX_OPACITY);
}

const processAvailability = (data) => {
    data.map(d => {
        AVAILABILITY_DATA[+d.day] = AVAILABILITY_DATA[+d.day] || {};
        AVAILABILITY_DATA[+d.day][+d.hour] = AVAILABILITY_DATA[+d.day][+d.hour] || {};
        let thresholdKey = AVAILABILITY_DATA[+d.day][+d.hour][+d.threshold];
        if (!thresholdKey) AVAILABILITY_DATA[+d.day][+d.hour][+d.threshold] = {};
        let stationKey = AVAILABILITY_DATA[+d.day][+d.hour][+d.threshold][+d.station_id];
        if (!stationKey) AVAILABILITY_DATA[+d.day][+d.hour][+d.threshold][+d.station_id] = {};
        AVAILABILITY_DATA[+d.day][+d.hour][+d.threshold][+d.station_id] = +d.availability;
    });
}

d3.csv("processed-data/station_bike_availability.csv").then(data => {
    processAvailability(data);
    console.log(AVAILABILITY_DATA)
})


d3.csv("processed-data/meta.csv").then((data) => {
    STATION_DATA = data.map(d => ({
        ...d,
        id: +d.id,
        x: projection([d.lon, d.lat])[0],
        y: projection([d.lon, d.lat])[1]
    }));

    svg
        .selectAll("circle")
        .data(STATION_DATA)
        .enter()
        .append("circle")
        .attr("class", "station")
        .attr("cx", (d) => projection([d.lon, d.lat])[0])
        .attr("cy", (d) => projection([d.lon, d.lat])[1])
        .attr("r", 3)
        .attr("fill", "red");
    STATION_BINS = hexbin(STATION_DATA);

    svg
        .append("g")
        .selectAll("path")
        .data(STATION_BINS)
        .join("path")
        .attr("transform", d => `translate(${d.x},${d.y})`)
        .attr("class", "hexagon")
        .attr("d", hexbin.hexagon(10))
        .attr("fill", "#ccc")
        .attr("fill-opacity", MAX_HEX_OPACITY)
        .attr("stroke", "gray")
        .append("title");

});

const reasonablyWalkableCircle = svg
    .append("circle")
    .attr("r", WALKABLE_RADIUS)
    .attr("cx", WIDTH / 2)
    .attr("cy", HEIGHT / 2)
    .attr("class", "walkable-circle")
    .attr("fill", "gray")
    .attr("fill-opacity", 0.8)
    .attr("stroke", "black")
    .attr("stroke-width", 2)
    .attr("stroke-dasharray", "5,5")
    .attr("opacity", MAX_HEX_OPACITY);

const walkableLabel = svg
    .append("text")
    .attr("x", WIDTH / 2)
    .attr("y", HEIGHT / 2)
    .attr("class", "walkable-label")
    .attr("text-anchor", "middle")
    .attr("dominant-baseline", "middle")
    .attr("font-size", 8)
    .attr("font-family", "sans-serif")
    .attr("fill", "black")
    .text("");

const withinRadius = (d, x, y, radius) => {
    return Math.sqrt(Math.pow(projection([d.lon, d.lat])[0] - x, 2) + Math.pow(projection([d.lon, d.lat])[1] - y, 2)) < radius;
}

svg.on("mousemove", (event) => {
    const [x, y] = d3.pointer(event);
    reasonablyWalkableCircle
        .attr("cx", x)
        .attr("cy", y)
        .attr("fill", "gray");
    let redThreshold = 0.5;
    reasonablyWalkableCircle.attr("fill-opacity", MAX_HEX_OPACITY).attr("opacity", 1);
    const currentRadius = reasonablyWalkableCircle.attr("r");
    // paint all stations red first
    svg.selectAll(".station").attr("fill", "red");
    // paint all stations within the walkable radius green
    svg.selectAll(".station")
        .filter((d) => withinRadius(d, x, y, currentRadius))
        .attr("fill", "green");

    if (!STATION_DATA || !STATION_BINS || !AVAILABILITY_DATA) return;
    // now get the actual data in the walkable radius
    const walkableStations = STATION_DATA.filter((d) => withinRadius(d, x, y, currentRadius));
    // For every station, calculate the probability of not finding a bike (1 - availability)
    // Then, calculate the product of all probabilities, which means not finding a bike at any station
    // Finally, calculate the probability of finding a bike by subtracting the product from 1
    const availabilities = walkableStations.map(s => 1 - AVAILABILITY_DATA[SELECTED_DAY][SELECTED_HOUR][SELECTED_THRESHOLD][s.id]);
    // Compute the product of finding at least one bike at any of the stations in the walkable radius
    const probabilityProduct = 1 - availabilities.reduce((a, b) => a * b, 1);
    if (probabilityProduct > 0) {
        const fillColor = hexColorMap((probabilityProduct - redThreshold) / (1 - redThreshold));
        reasonablyWalkableCircle.attr("fill", fillColor);
    }
    let probabilityText = probabilityProduct > 0 ? `${(probabilityProduct * 100).toFixed(2)}%` : "0%";
    let probabilityMath = currentRadius > 90 ? `P(#bikes ≥ ${SELECTED_THRESHOLD}) = ` : "";
    walkableLabel
        .text(probabilityMath + probabilityText)
        .attr("x", x)
        .attr("y", y - 3 - currentRadius / 6)
        .attr("opacity", 1)
        .attr("font-size", Math.min(14, currentRadius / 3));
});



const zoomed = (transform) => {
    const tiles = tile(transform);
    projection
        .scale(transform.k / (2 * Math.PI))
        .translate([transform.x, transform.y]);
    hexbin.radius(10 * transform.k / (1 << 20));

    if (STATION_DATA) {
        STATION_DATA = STATION_DATA.map(d => ({
            ...d,
            x: projection([d.lon, d.lat])[0],
            y: projection([d.lon, d.lat])[1]
        }));
        STATION_BINS = hexbin(STATION_DATA);
    }

    image = image.data(tiles, d => d).join("image")
        .attr("xlink:href", d => mapboxUrl(...d3.tileWrap(d)))
        .attr("x", ([x]) => (x + tiles.translate[0]) * tiles.scale)
        .attr("y", ([, y]) => (y + tiles.translate[1]) * tiles.scale)
        .attr("width", tiles.scale)
        .attr("height", tiles.scale);


    renderStations();
    renderHexbin();
    reasonablyWalkableCircle.attr("r", WALKABLE_RADIUS * transform.k / (1 << 20));
}

const hideHexagonsAndCircle = () => {
    // Hide the hexagons and the walkable circle when doing a zoom
    svg.selectAll(".hexagon").transition(d3.transition().duration(0)).attr("fill-opacity", 0).attr("opacity", 0);
    walkableLabel.attr("opacity", 0);
    reasonablyWalkableCircle.attr("fill-opacity", 0).attr("opacity", 0);
}

const showHexagons = () => {
    svg.selectAll(".hexagon").transition(d3.transition().duration(200)).attr("fill-opacity", MAX_HEX_OPACITY).attr("opacity", 1);
}



const zoom = d3.zoom()
    .scaleExtent([1 << 20, 1 << 23])
    .extent([[0, 0], [WIDTH, HEIGHT]])
    .on("zoom", ({ transform }) => { zoomed(transform) })
    .on("start", hideHexagonsAndCircle)
    .on("end", showHexagons);


svg
    .call(zoom)
    // Centered on Santiago .translate(103380, -51420)
    .call(zoom.transform, d3.zoomIdentity
        .translate(WIDTH / 2, HEIGHT / 2)
        .scale(-(1 << 20))
        .translate(...projection([-70.6, -33.43]))
        .scale(-1));