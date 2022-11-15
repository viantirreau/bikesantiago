import json

# Read the geojson file
with open("raw-data/chilean-communes.geojson") as f:
    gj = json.load(f)

# Extract the features and filter the ones with "Provincia" == "Santiago"
features = [f for f in gj["features"] if f["properties"]["Provincia"] == "Santiago"]

# Create a new geojson object with the filtered features
gj_filtered = {
    "type": "FeatureCollection",
    "name": "santiago-communes",
    "crs": gj["crs"],
    "features": features,
}

# Write the new geojson file
with open("visualization/processed-data/santiago-communes.geojson", "w") as f:
    json.dump(gj_filtered, f)
