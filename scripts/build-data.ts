import { XMLParser } from "fast-xml-parser";

const ADVISORY_URL =
  "https://cadatacatalog.state.gov/dataset/4a387c35-29cb-4902-b91d-3da0dc02e4b2/resource/4c727464-8e6f-4536-b0a5-0a343dc6c7ff/download/traveladvisory.xml";

async function getData() {
  const advisoryResponse = await fetch(ADVISORY_URL);
  const advisoryXml = await advisoryResponse.text();

  const parser = new XMLParser();
  let advisories = parser.parse(advisoryXml);
  return advisories;
}

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

getData()
  .then((advisories) => transformData(advisories.feed.entry))
  .then((advisories) => console.log(advisories));
