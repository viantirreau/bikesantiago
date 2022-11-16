const WIDTH = 800;
const HEIGHT = 500;

const svg = d3
    .select("body")
    .append("svg")
    .attr("width", WIDTH)
    .attr("height", HEIGHT);

d3.json("processed-data/comunas.json").then((data) => {
    projection = d3.geoIdentity().reflectY(true).fitSize([WIDTH, HEIGHT], data);
    svg
        .selectAll("path")
        .data(data.features)
        .enter()
        .append("path")
        .attr("d", d3.geoPath().projection(projection))
        .attr("fill", "lightblue")
        .attr("stroke", "#333");
    return projection;
}).then(projection => d3.csv("processed-data/meta.csv").then((data) => {
    svg
        .selectAll("circle")
        .data(data)
        .enter()
        .append("circle")
        .attr("cx", (d) => projection([d.lon, d.lat])[0])
        .attr("cy", (d) => projection([d.lon, d.lat])[1])
        .attr("r", 2)
        .attr("fill", "red");
}));
