import maplibregl from "maplibre-gl";

var map = new maplibregl.Map({
  container: 'map',
  style: 'https://api.maptiler.com/maps/basic-v2/style.json?key=tCPs0pg6r8mncTKFtDd1', // stylesheet location
  center: [-5.35, 32.14], // starting position [lng, lat]
  zoom: 1 // starting zoom
});
