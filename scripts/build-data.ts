import { XMLParser } from "fast-xml-parser";
import { writeFileSync } from "fs";
import { FeatureCollection } from "geojson";
import { Source, read as readShapefile } from "shapefile";
import { fromBuffer as unzipBuffer } from "yauzl";

const ADVISORY_URL =
  "https://cadatacatalog.state.gov/dataset/4a387c35-29cb-4902-b91d-3da0dc02e4b2/resource/4c727464-8e6f-4536-b0a5-0a343dc6c7ff/download/traveladvisory.xml";
const NATURAL_EARTH_URL = "https://www.naturalearthdata.com/http//www.naturalearthdata.com/download/50m/cultural/ne_50m_admin_0_countries.zip";
const MEXICAN_STATES_URL = "https://www.naturalearthdata.com/http//www.naturalearthdata.com/download/10m/cultural/ne_10m_admin_1_states_provinces.zip"

const LOOKUPS = {
  "Burma (Myanmar)": "Myanmar",
  "Eswatini": "eSwatini",
  "Cote d Ivoire": "Ivory Coast",
  "The Gambia": "Gambia",
  "Czech Republic": "Czechia",
  "Kingdom of Denmark": "Denmark",
  "See Summaries": "China",
  "Serbia": "Republic of Serbia",
  "Timor-Leste": "East Timor",
  "Micronesia": "Federated States of Micronesia",
  "Sao Tome and Principe": "São Tomé and Principe",
  "See State Summaries": "Mexico",
};

const MEXICO_LOOKUPS = {
  "Nuevo Leon": "Nuevo León",
  "San Luis Potosi": "San Luis Potosí",
  "Michoacan": "Michoacán",
  "Queretaro": "Querétaro",
  "Yucatan": "Yucatán",
  "Mexico City": "Distrito Federal",
  "Mexico State": "México",
}

const LEVEL_TEXT_TO_NUMBER = {
  "Exercise Normal Precautions": 1,
  "Exercise Increased Caution": 2,
  "Reconsider Travel": 3,
  "Do Not Travel": 4
}

function fix_null_string(s: string) {
  return s.replace(/\0/g, '').trim();
}

/**
 * Fetch and parse data from the State Department
 */
async function getStateDepartmentData() {
  const advisoryResponse = await fetch(ADVISORY_URL);
  const advisoryXml = await advisoryResponse.text();

  const parser = new XMLParser();
  let advisories = parser.parse(advisoryXml);
  return advisories;
}

async function readShapefileZip(buffer: ArrayBuffer): Promise<FeatureCollection> {
  return await new Promise((resolve) => {
    // unzip file being downloaded
    unzipBuffer(Buffer.from(buffer), { lazyEntries: true }, (err, zipfile) => {
      if (err) throw err;
      let shpStream, dbfStream;
      // read entries, saving the .shp and .dbf files as streams
      zipfile.readEntry();
      zipfile.on("entry", (entry) => {
        if (entry.fileName.endsWith(".shp")) {
          zipfile.openReadStream(entry, (err, readStream) => {
            if (err) throw err;
            shpStream = readStream;
          });
        } else if (entry.fileName.endsWith(".dbf")) {
          zipfile.openReadStream(entry, (err, readStream) => {
            if (err) throw err;
            dbfStream = readStream;
          });
        }
        zipfile.readEntry();
      });

      // once done reading the zip file, load the shapefile and organize by name (using multiple names to be thorough)
      zipfile.on("end", () => readShapefile(shpStream, dbfStream, { encoding: "UTF-8" }).then(source => resolve(source)));
    });
  });
}

/** Fetch, parse, and organize sovereign countries from https://www.naturalearthdata.com/ by name */
async function getNaturalEarthData() {
  const naturalEarthResponse = await fetch(NATURAL_EARTH_URL);
  const naturalEarthBuffer = await naturalEarthResponse.arrayBuffer();
  const collection = await readShapefileZip(naturalEarthBuffer);
  for (let feature of collection.features) {
    if (feature.properties) {
      feature.properties = {
        names: fix_null_string(feature.properties.NAME),
        geounit: fix_null_string(feature.properties.GEOUNIT),
        sovereign: fix_null_string(feature.properties.SOVEREIGNT)
      };
    }
  }
  return collection.features.reduce((obj, cur) => {
    // Create lookup dictionaries based on name, geounit, and sovereign name properties of the data
    let name = cur.properties?.name;
    let geounit = cur.properties?.geounit;
    let sovereign = cur.properties?.sovereign;
    obj.name[name] = [...(obj.name[name] || []), cur];
    obj.geounit[geounit] = [...(obj.geounit[geounit] || []), cur];
    obj.sovereign[sovereign] = [...(obj.sovereign[sovereign] || []), cur];
    return obj;
  }, { name: {}, geounit: {}, sovereign: {} });
}

/** Fetch, parse, and organize sovereign countries from https://www.naturalearthdata.com/ by name */
async function getMexicanStates() {
  const naturalEarthResponse = await fetch(MEXICAN_STATES_URL);
  const naturalEarthBuffer = await naturalEarthResponse.arrayBuffer();
  const collection = await readShapefileZip(naturalEarthBuffer);
  const result = collection.features.filter(feature => feature.properties.iso_a2 === 'MX').map(feature => ({
    ...feature,
    properties: {
      name: fix_null_string(feature.properties.name),
    },
  }));
  return result.reduce((obj, cur) => ({ [cur.properties?.name]: cur, ...obj }), {});
}

// Transform the advisory data to have consistent names and the data we need
function transformData(advisories: StateDepartmentAdvisory[]): Advisory[] {
  return advisories.map((advisory) => {
    let name, level;
    if (advisory.title.startsWith("See State Summaries")) {
      name = "Mexico";
      level = advisory.title.split(" - ")[1];
    } else if (advisory.title.startsWith("See Summaries - Mainland China")) {
      name = "China";
      level = advisory.title.split(" - ")[2];
    } else if (advisory.title.startsWith("See Individual Summaries")) {
      name = "Israel";
      level = advisory.title.split(" - ")[1];
    } else {
      name = advisory.title.split(" - ")[0];
      level = advisory.title.split(" - ")[1];
    }
    level = level.replace(/Level (\d):.*/, "$1");
    return {
      name,
      level: parseInt(level),
      link: advisory.id,
      summary: advisory.summary,
      published: advisory.published,
      updated: advisory.updated,
    }
  });
}

Promise.all([
  getNaturalEarthData(),
  getMexicanStates(),
  getStateDepartmentData()
    .then((advisories) => transformData(advisories.feed.entry))
]).then(([geometry, mexican_states, advisories]: [any, any, any]) => {
  let features = [];
  // Iterate through advisories and find the matching geometry
  for (let area of advisories) {
    let name = (LOOKUPS[area.name] || area.name).trim();
    if (name === "Mexico") {
      let stateSummarySection = area.summary.substring(area.summary.indexOf("<p><b><u>"));
      let stateSummaries = stateSummarySection.replace(/\n/g, '').split("</p><p><b><u>");
      stateSummaries = stateSummaries.map(summary => {
        let name = summary.split(/( state| \([A-Za-z ]+\))(\s|&nbsp;)– /)[0].replace("<p><b><u>", "");
        name = MEXICO_LOOKUPS[name] || name;
        let match = mexican_states[name];
        if (match) {
          match.properties = {
            name,
            level: LEVEL_TEXT_TO_NUMBER[summary.replace(/.*(\s|&nbsp;)– ([A-Za-z ]+)<\/u>.*/, "$2")],
            summary: summary.substring(summary.indexOf("</u></b></p>") + "</u></b></p>".length),
            link: area.link
          };
          features.push(match);
        } else {
          console.log("Couldn't find match for", name);
        }
      });
      continue;
    }
    // Look based on name first, then geounit, then sovereign
    // (matching only on sovereign can lead to e.g. tiny islands being chosen for Australia)
    let match = geometry.name[name] || geometry.geounit[name] || geometry.sovereign[name];
    if (match) {
      if (match.length > 1) {
        console.error("Found multiple matches for", name);
      }
      let feature = match[0];
      feature.properties = area;
      features.push(feature);
    } else {
      console.error("couldn't find match for \"" + name + "\"");
    }
  }
  writeFileSync('src/countries-with-advisories.json', JSON.stringify({ type: 'FeatureCollection', features }));
});

type StateDepartmentAdvisory = {
  title: string;
  author: {
    email: string;
    name: string;
    uri: string;
  };
  link: string;
  category: string[];
  summary: string;
  id: string;
  published: string;
  updated: string;
};

type Advisory = {
  name: string;
  level: number;
  link: string;
  summary: string;
  published: string;
  updated: string;
};
