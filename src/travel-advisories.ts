import maplibregl from "maplibre-gl";
import advisoryData from "./countries-with-advisories.json";

const LEVELS = [
  null,
  "Exercise Normal Precautions",
  "Exercise Increased Caution",
  "Reconsider Travel",
  "Do Not Travel",
];

async function onLoadPage() {
  var map = new maplibregl.Map({
    container: 'map',
    style: 'https://api.maptiler.com/maps/basic-v2/style.json?key=tCPs0pg6r8mncTKFtDd1', // stylesheet location
    center: [-5.35, 32.14], // starting position [lng, lat]
    zoom: 1 // starting zoom
  });
  map.on('load', () => {
    const sidebarContent = document.getElementById("sidebar")?.innerHTML;
    const layers = map.getStyle().layers;
    // Find the index of the first symbol layer in the map style
    let firstSymbolId: string | undefined;
    for (let i = 0; i < layers.length; i++) {
      if (layers[i].type === 'symbol') {
        firstSymbolId = layers[i].id;
        break;
      }
    }

    map.addSource('countries', { type: 'geojson', data: advisoryData as any });

    map.addLayer({
      'id': 'countries',
      'type': 'fill',
      'source': 'countries',
      'layout': {},
      'paint': {
        'fill-color': [
          'case',
          ['==', ['get', 'level'], 1], '#2ecc71',
          ['==', ['get', 'level'], 2], '#f1c40f',
          ['==', ['get', 'level'], 3], '#e67e22',
          ['==', ['get', 'level'], 4], '#e74c3c',
          '#222',
        ],
        'fill-opacity': 0.8
      }
    }, firstSymbolId);


    // When a click event occurs on a feature in the states layer, open a popup at the
    // location of the click, with description HTML from its properties.
    map.on('click', 'countries', (e) => {
      let feature = e.features?.[0];
      let sidebar = document.getElementById("sidebar");
      if (feature) {
        if (sidebar && feature?.properties.summary) {
          const back = document.createElement("a");
          back.setAttribute("href", "#");
          back.onclick = (event) => {
            event.preventDefault();
            if (sidebar) sidebar.innerHTML = sidebarContent || "Error resetting sidebar";
          };
          back.textContent = "← Back";

          const header = document.createElement("h2");
          header.textContent = feature.properties.name;

          const subhead = document.createElement("h3");
          const level = feature.properties.level;
          subhead.innerHTML = `<span class="level-chip level-${level}">Level ${level}</span> ${LEVELS[level]}`

          const link = document.createElement("a");
          link.setAttribute("href", feature.properties.link);
          link.setAttribute("target", "_blank");
          link.setAttribute("rel", "noopener noreferrer");
          link.textContent = "View on travel.state.gov";

          const body = document.createElement("div");

          sidebar.innerHTML = '';
          sidebar.appendChild(back);
          sidebar.appendChild(header);
          sidebar.appendChild(subhead);
          sidebar.appendChild(link);
          sidebar.appendChild(body);
          body.innerHTML = feature.properties.summary;
        }
      }
    });

    // Change the cursor to a pointer when the mouse is over the states layer.
    map.on('mouseenter', 'countries', () => {
      map.getCanvas().style.cursor = 'pointer';
    });

    // Change it back to a pointer when it leaves.
    map.on('mouseleave', 'countries', () => {
      map.getCanvas().style.cursor = '';
    });
  });
}

window.onload = onLoadPage;
