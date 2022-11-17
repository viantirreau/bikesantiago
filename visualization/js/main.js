const WIDTH = 1000;
const HEIGHT = 700;
const MAPBOX_ACCESS_TOKEN = 'pk.eyJ1IjoidmlhbnRpcnJlYXUiLCJhIjoiY2xhazJpOHdyMDF2MTNwbnMxbzkzMmpsayJ9.7tkQiRhR40t8P7_vXCRXfw'
const MAP_STYLE = 'viantirreau/clajy669c002414lgwdtdkz22'
let STATION_DATA = null;

// Adapted from https://observablehq.com/@d3/zoomable-map-tiles
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


const renderStations = (data, transform) => {
    if (!data) return;
    svg
        .selectAll("circle")
        .attr("cx", (d) => projection([d.lon, d.lat])[0])
        .attr("cy", (d) => projection([d.lon, d.lat])[1])
        .attr("r", 3)
        .attr("fill", "red");
}


d3.csv("processed-data/meta.csv").then((data) => {
    STATION_DATA = data;
    svg
        .selectAll("circle")
        .data(data)
        .enter()
        .append("circle")
        .attr("cx", (d) => projection([d.lon, d.lat])[0])
        .attr("cy", (d) => projection([d.lon, d.lat])[1])
        .attr("r", 3)
        .attr("fill", "red");
});


const zoomed = (transform) => {
    const tiles = tile(transform);

    image = image.data(tiles, d => d).join("image")
        .attr("xlink:href", d => mapboxUrl(...d3.tileWrap(d)))
        .attr("x", ([x]) => (x + tiles.translate[0]) * tiles.scale)
        .attr("y", ([, y]) => (y + tiles.translate[1]) * tiles.scale)
        .attr("width", tiles.scale)
        .attr("height", tiles.scale);

    projection
        .scale(transform.k / (2 * Math.PI))
        .translate([transform.x, transform.y]);

    renderStations(STATION_DATA, transform);

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
        .scale(-(1 << 19))
        .translate(...projection([-70.6693, -33.4489]))
        .scale(-1));

