const WIDTH = 1000;
const HEIGHT = 700;
const MAPBOX_ACCESS_TOKEN = 'pk.eyJ1IjoidmlhbnRpcnJlYXUiLCJhIjoiY2xhazJpOHdyMDF2MTNwbnMxbzkzMmpsayJ9.7tkQiRhR40t8P7_vXCRXfw'
const MAP_STYLE = 'viantirreau/clajy669c002414lgwdtdkz22'

// Adapted from https://observablehq.com/@d3/zoomable-map-tiles
const svg = d3
    .select("body")
    .append("svg")
    .attr("width", WIDTH)
    .attr("height", HEIGHT);

const tile = d3.tile()
    .extent([[0, 0], [WIDTH, HEIGHT]])
    .tileSize(512)
    .clampX(false);
const mapboxUrl = (x, y, z) => `https://api.mapbox.com/styles/v1/${MAP_STYLE}/tiles/${z}/${x}/${y}@2x?access_token=${MAPBOX_ACCESS_TOKEN}`;

const zoomed = (transform) => {
    const tiles = tile(transform);

    image = image.data(tiles, d => d).join("image")
        .attr("xlink:href", d => mapboxUrl(...d3.tileWrap(d)))
        .attr("x", ([x]) => (x + tiles.translate[0]) * tiles.scale)
        .attr("y", ([, y]) => (y + tiles.translate[1]) * tiles.scale)
        .attr("width", tiles.scale)
        .attr("height", tiles.scale);
}


const zoom = d3.zoom()
    .scaleExtent([1 << 19, 1 << 22])
    .extent([[0, 0], [WIDTH, HEIGHT]])
    .on("zoom", ({ transform }) => { console.log(transform); zoomed(transform) });

let image = svg.append("g")
    .attr("pointer-events", "none")
    .selectAll("image");

svg
    .call(zoom)
    .call(zoom.transform, d3.zoomIdentity
        .translate(103380, -51420) // Centered on Santiago
        .scale(1 << 19));

// d3.json("processed-data/comunas.json").then((data) => {
//     projection = d3.geoIdentity().reflectY(true).fitSize([WIDTH, HEIGHT], data);
//     svg
//         .selectAll("path")
//         .data(data.features)
//         .enter()
//         .append("path")
//         .attr("d", d3.geoPath().projection(projection))
//         .attr("fill", "lightblue")
//         .attr("stroke", "#333");
//     return projection;
// }).then(projection => d3.csv("processed-data/meta.csv").then((data) => {
//     svg
//         .selectAll("circle")
//         .data(data)
//         .enter()
//         .append("circle")
//         .attr("cx", (d) => projection([d.lon, d.lat])[0])
//         .attr("cy", (d) => projection([d.lon, d.lat])[1])
//         .attr("r", 2)
//         .attr("fill", "red");
// }));
