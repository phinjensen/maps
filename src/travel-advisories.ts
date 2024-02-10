import maplibregl from "maplibre-gl";
import advisoryData from "./countries-with-advisories.json";

async function onLoadPage() {
  var map = new maplibregl.Map({
    container: 'map',
    style: 'https://api.maptiler.com/maps/basic-v2/style.json?key=tCPs0pg6r8mncTKFtDd1', // stylesheet location
    center: [-5.35, 32.14], // starting position [lng, lat]
    zoom: 1 // starting zoom
  });
  map.on('load', () => {
    map.addSource('countries', { type: 'geojson', data: advisoryData as any });

    map.addLayer({
      'id': 'countries',
      'type': 'fill',
      'source': 'countries',
      'layout': {},
      'paint': {
        'fill-color': '#088',
        'fill-opacity': 0.8
      }
    });
  });
}

window.onload = onLoadPage;
