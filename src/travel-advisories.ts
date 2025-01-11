import maplibregl from "maplibre-gl";
import advisoryData from "./countries-with-advisories.json";

// map level numbers to the level description
const LEVELS = [
  null,
  "Exercise Normal Precautions",
  "Exercise Increased Caution",
  "Reconsider Travel",
  "Do Not Travel",
];

async function onLoadPage() {
  // init map
  var map = new maplibregl.Map({
    container: 'map',
    style: 'https://api.maptiler.com/maps/basic-v2/style.json?key=tCPs0pg6r8mncTKFtDd1', // stylesheet location
    center: [-5.35, 32.14],
    zoom: 1,
    attributionControl: {
      compact: true,
      customAttribution: `<a href="https://cadatacatalog.state.gov/dataset/travel">Travel advisories</a> by the <a href="https://travel.state.gov/content/travel.html">Bureau of Consular Affairs</a>, licensed under <a href="https://creativecommons.org/licenses/by/4.0/">CC BY 4.0</a>`
    }
  });

  map.on('load', async () => {
    // Save initial sidebar content
    const sidebarContent = document.getElementById("sidebar")?.innerHTML;

    // Find the index of the first symbol layer in the map style
    const layers = map.getStyle().layers;
    let firstSymbolId: string | undefined;
    for (let i = 0; i < layers.length; i++) {
      if (layers[i].type === 'symbol') {
        firstSymbolId = layers[i].id;
        break;
      }
    }

    // Add main data source
    map.addSource('countries', { type: 'geojson', data: advisoryData as any });

    // Add styling for different advisory levels. Weirdly, this doesn't work in a loop, hence the manual definition of each pattern
    let image = await map.loadImage(new URL(`images/level-1.png`, import.meta.url).toString());
    map.addImage('pattern1', image.data);
    image = await map.loadImage(new URL(`images/level-1.5.png`, import.meta.url).toString());
    map.addImage('pattern1.5', image.data);
    image = await map.loadImage(new URL(`images/level-2.png`, import.meta.url).toString());
    map.addImage('pattern2', image.data);
    image = await map.loadImage(new URL(`images/level-2.5.png`, import.meta.url).toString());
    map.addImage('pattern2.5', image.data);
    image = await map.loadImage(new URL(`images/level-3.png`, import.meta.url).toString());
    map.addImage('pattern3', image.data);
    image = await map.loadImage(new URL(`images/level-3.5.png`, import.meta.url).toString());
    map.addImage('pattern3.5', image.data);
    image = await map.loadImage(new URL(`images/level-4.png`, import.meta.url).toString());
    map.addImage('pattern4', image.data);

    map.addLayer({
      'id': 'countries',
      'type': 'fill',
      'source': 'countries',
      'paint': {
        'fill-pattern': [
          'match', ['concat', ['get', 'level'], ['get', 'increasedRiskInAreas']],
          '1false', 'pattern1',
          '1true', 'pattern1.5',
          '2false', 'pattern2',
          '2true', 'pattern2.5',
          '3false', 'pattern3',
          '3true', 'pattern3.5',
          '4false', 'pattern4',
          '4true', 'pattern4',
          'none',
        ],
        'fill-opacity': 0.8,
      }
    }, firstSymbolId);

    map.on('click', 'countries', (e) => {
      let feature = e.features?.[0];
      let sidebar = document.getElementById("sidebar");
      if (feature && sidebar && feature?.properties.summary) {
        // Back button which resets sidebar content
        const back = document.createElement("a");
        back.setAttribute("href", "#");
        back.onclick = (event) => {
          event.preventDefault();
          if (sidebar) sidebar.innerHTML = sidebarContent || "Error resetting sidebar";
        };
        back.textContent = "← Back";

        // Header with location name
        const header = document.createElement("h2");
        header.textContent = feature.properties.name;

        // Subheader with advisory level
        const subhead = document.createElement("h3");
        const level = feature.properties.level;
        subhead.innerHTML = `<span class="level-chip level-${level}">Level ${level}</span> ${LEVELS[level]}`

        // Link to state departmentw ebsite
        const link = document.createElement("a");
        link.setAttribute("href", feature.properties.link);
        link.setAttribute("target", "_blank");
        link.setAttribute("rel", "noopener noreferrer");
        link.textContent = "View on travel.state.gov";

        // Main description
        const body = document.createElement("div");
        body.innerHTML = feature.properties.summary;

        sidebar.innerHTML = '';
        sidebar.appendChild(back);
        sidebar.appendChild(header);
        sidebar.appendChild(subhead);
        sidebar.appendChild(link);
        sidebar.appendChild(body);
      }
    });

    // Change the cursor to a pointer when the mouse is over the countries layer.
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
