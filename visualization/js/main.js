const WIDTH = 800;
const HEIGHT = 600;
const MAPBOX_ACCESS_TOKEN = 'pk.eyJ1IjoidmlhbnRpcnJlYXUiLCJhIjoiY2xhazJpOHdyMDF2MTNwbnMxbzkzMmpsayJ9.7tkQiRhR40t8P7_vXCRXfw'
const MAP_STYLE = 'viantirreau/clajy669c002414lgwdtdkz22'
let STATION_DATA = null;
let STATION_BINS = null;
// Recursive map of day,hour,threshold,station_id,availability
let AVAILABILITY_DATA = {};
let SELECTED_DAY = 0;
let SELECTED_HOUR = 0;
let SELECTED_THRESHOLD = 1;

// Adapted from https://observablehq.com/@d3/zoomable-map-tiles
// https://observablehq.com/@d3/zoomable-raster-vector

const svg = d3
    .select("body")
    .append("svg")
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
        .selectAll("circle")
        .attr("cx", (d) => projection([d.lon, d.lat])[0])
        .attr("cy", (d) => projection([d.lon, d.lat])[1])
        .attr("r", 3)
        .attr("fill", "red");
}

const renderHexbin = (data, transform) => {
    if (!STATION_DATA) return;

    svg.selectAll(".hexagon")
        .data(data)
        .attr("transform", d => `translate(${d.x},${d.y})`)
        .attr("d", hexbin.hexagon())
        .attr("fill", stations => {
            let availabilities = stations.map(s => 1 - AVAILABILITY_DATA[SELECTED_DAY][SELECTED_HOUR][SELECTED_THRESHOLD][s.id]);
            // Return the product of all availabilities
            let probabilityProduct = availabilities.reduce((a, b) => a * b, 1);
            return hexColorMap(1 - 4 * probabilityProduct);
        });
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
        .attr("fill-opacity", 0.5)
        .attr("stroke", "red")
        .append("title");

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


    renderStations(STATION_DATA, transform);
    renderHexbin(STATION_BINS, transform);
}


const zoom = d3.zoom()
    .scaleExtent([1 << 19, 1 << 22])
    .extent([[0, 0], [WIDTH, HEIGHT]])
    .on("zoom", ({ transform }) => { zoomed(transform) });


svg
    .call(zoom)
    // Centered on Santiago .translate(103380, -51420)
    .call(zoom.transform, d3.zoomIdentity
        .translate(WIDTH / 2, HEIGHT / 2)
        .scale(-(1 << 20))
        .translate(...projection([-70.6, -33.43]))
        .scale(-1));

