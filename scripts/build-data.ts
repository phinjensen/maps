import { XMLParser } from "fast-xml-parser";
import { writeFileSync } from "fs";
import { open as openShapefile, read as readShapefile } from "shapefile";
import { fromBuffer as unzipBuffer } from "yauzl";

const ADVISORY_URL =
  "https://cadatacatalog.state.gov/dataset/4a387c35-29cb-4902-b91d-3da0dc02e4b2/resource/4c727464-8e6f-4536-b0a5-0a343dc6c7ff/download/traveladvisory.xml";
const NATURAL_EARTH_URL = "https://www.naturalearthdata.com/http//www.naturalearthdata.com/download/50m/cultural/ne_50m_admin_0_countries.zip";

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
};

async function getStateDepartmentData() {
  const advisoryResponse = await fetch(ADVISORY_URL);
  const advisoryXml = await advisoryResponse.text();

  const parser = new XMLParser();
  let advisories = parser.parse(advisoryXml);
  return advisories;
}

async function getNaturalEarthData() {
  const naturalEarthResponse = await fetch(NATURAL_EARTH_URL);
  const naturalEarthBuffer = await naturalEarthResponse.arrayBuffer();
  return await new Promise((resolve) => {
    unzipBuffer(Buffer.from(naturalEarthBuffer), { lazyEntries: true }, (err, zipfile) => {
      if (err) throw err;
      let shpStream, dbfStream;
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
      zipfile.on("end", () => {
        readShapefile(shpStream, dbfStream, { encoding: "UTF-8" }).then(async source => {
          for (let feature of source.features) {
            if (feature.properties) {
              feature.properties = {
                names: feature.properties.NAME.replace(/\0/g, '').trim(),
                geounit: feature.properties.GEOUNIT.replace(/\0/g, '').trim(),
                sovereign: feature.properties.SOVEREIGNT.replace(/\0/g, '').trim()
              };
            }
          }
          resolve(source.features);
        }
        );
      });
    })
  });;
}

function transformData(advisories: StateDepartmentAdvisory[]): Advisory[] {
  return advisories.map((advisory) => {
    let name, level;
    if (advisory.title.startsWith("See Summaries - Mainland China")) {
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
  getNaturalEarthData().then((features: any) => features.reduce((obj, cur) => {
    let name = cur.properties.name;
    let geounit = cur.properties.geounit;
    let sovereign = cur.properties.sovereign;
    obj.name[name] = [...(obj.name[name] || []), cur];
    obj.geounit[geounit] = [...(obj.geounit[geounit] || []), cur];
    obj.sovereign[sovereign] = [...(obj.sovereign[sovereign] || []), cur];
    return obj;
  }, { name: {}, geounit: {}, sovereign: {} })),
  getStateDepartmentData()
    .then((advisories) => transformData(advisories.feed.entry))
]).then(([geometry, advisories]: [any, any]) => {
  let features = [];
  for (let area of advisories) {
    let name = (LOOKUPS[area.name] || area.name).trim();
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
