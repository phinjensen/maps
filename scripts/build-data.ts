import { XMLParser } from "fast-xml-parser";

const ADVISORY_URL = "https://cadatacatalog.state.gov/dataset/4a387c35-29cb-4902-b91d-3da0dc02e4b2/resource/4c727464-8e6f-4536-b0a5-0a343dc6c7ff/download/traveladvisory.xml"

async function getData() {
  const advisoryResponse = await fetch(ADVISORY_URL);
  const advisoryXml = await advisoryResponse.text();

  const parser = new XMLParser();
  let advisories = parser.parse(advisoryXml);
  return advisories
}

getData().then(advisories => console.log(advisories.feed.entry))
