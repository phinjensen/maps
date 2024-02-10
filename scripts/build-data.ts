import { XMLParser } from "fast-xml-parser";
import { writeFileSync } from "fs";
import { Source, open as openShapefile } from "shapefile";
import { fromBuffer as unzipBuffer } from "yauzl";

const ADVISORY_URL =
  "https://cadatacatalog.state.gov/dataset/4a387c35-29cb-4902-b91d-3da0dc02e4b2/resource/4c727464-8e6f-4536-b0a5-0a343dc6c7ff/download/traveladvisory.xml";
const NATURAL_EARTH_URL = "https://www.naturalearthdata.com/http//www.naturalearthdata.com/download/50m/cultural/ne_50m_admin_0_countries.zip";

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
        openShapefile(shpStream, dbfStream).then(async source => {
          let features: any[] = [];
          let entry: any = await source.read();
          while (!entry.done) {
            if (entry.value) {
              let feature = entry.value;
              if (feature.properties) feature.properties = { name: feature.properties.SOVEREIGNT.replace(/\0/g, '') };
              features.push(feature);
            }
            entry = await source.read();
          }
          resolve(features);
        });
      });
    })
  });;
}

function transformData(advisories: StateDepartmentAdvisory[]): Advisory[] {
  return advisories.map((advisory) => ({
    name: advisory.title.split(" - ")[0],
    level: parseInt(
      advisory.title.split(" - ")[1].replace(/Level (\d):.*/, "$1"),
    ),
    link: advisory.id,
    summary: advisory.summary,
    published: advisory.published,
    updated: advisory.updated,
  }));
}

Promise.all([
  getNaturalEarthData(),
  getStateDepartmentData()
    .then((advisories) => transformData(advisories.feed.entry).reduce((obj, cur) => ({ [cur.name]: cur, ...obj }), {}))
]).then(([geometry, advisories]: [any, any]) => {
  for (let country of geometry) {
    let advisory = advisories[country.properties.name];
    if (advisory) {
      country.properties = advisory;
    } else {
      console.error("couldn't find match for", country.properties.name);
    }
  }
  writeFileSync('countries-with-advisories.json', JSON.stringify({ type: 'FeatureCollection', features: geometry }));
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
