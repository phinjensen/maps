"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
var fast_xml_parser_1 = require("fast-xml-parser");
var fs_1 = require("fs");
var shapefile_1 = require("shapefile");
var yauzl_1 = require("yauzl");
var ADVISORY_URL = "https://cadatacatalog.state.gov/dataset/4a387c35-29cb-4902-b91d-3da0dc02e4b2/resource/4c727464-8e6f-4536-b0a5-0a343dc6c7ff/download/traveladvisory.xml";
var NATURAL_EARTH_URL = "https://www.naturalearthdata.com/http//www.naturalearthdata.com/download/50m/cultural/ne_50m_admin_0_countries.zip";
var MEXICAN_STATES_URL = "https://www.naturalearthdata.com/http//www.naturalearthdata.com/download/10m/cultural/ne_10m_admin_1_states_provinces.zip";
var LOOKUPS = {
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
var MEXICO_LOOKUPS = {
    "Nuevo Leon": "Nuevo León",
    "San Luis Potosi": "San Luis Potosí",
    "Michoacan": "Michoacán",
    "Queretaro": "Querétaro",
    "Yucatan": "Yucatán",
    "Mexico City": "Distrito Federal",
    "Mexico State": "México",
};
var LEVEL_TEXT_TO_NUMBER = {
    "Exercise Normal Precautions": 1,
    "Exercise Increased Caution": 2,
    "Reconsider Travel": 3,
    "Do Not Travel": 4
};
function fix_null_string(s) {
    return s.replace(/\0/g, '').trim();
}
/**
 * Fetch and parse data from the State Department
 */
function getStateDepartmentData() {
    return __awaiter(this, void 0, void 0, function () {
        var advisoryResponse, advisoryXml, parser, advisories;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, fetch(ADVISORY_URL)];
                case 1:
                    advisoryResponse = _a.sent();
                    return [4 /*yield*/, advisoryResponse.text()];
                case 2:
                    advisoryXml = _a.sent();
                    parser = new fast_xml_parser_1.XMLParser();
                    advisories = parser.parse(advisoryXml);
                    return [2 /*return*/, advisories];
            }
        });
    });
}
function readShapefileZip(buffer) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, new Promise(function (resolve) {
                        // unzip file being downloaded
                        (0, yauzl_1.fromBuffer)(Buffer.from(buffer), { lazyEntries: true }, function (err, zipfile) {
                            if (err)
                                throw err;
                            var shpStream, dbfStream;
                            // read entries, saving the .shp and .dbf files as streams
                            zipfile.readEntry();
                            zipfile.on("entry", function (entry) {
                                if (entry.fileName.endsWith(".shp")) {
                                    zipfile.openReadStream(entry, function (err, readStream) {
                                        if (err)
                                            throw err;
                                        shpStream = readStream;
                                    });
                                }
                                else if (entry.fileName.endsWith(".dbf")) {
                                    zipfile.openReadStream(entry, function (err, readStream) {
                                        if (err)
                                            throw err;
                                        dbfStream = readStream;
                                    });
                                }
                                zipfile.readEntry();
                            });
                            // once done reading the zip file, load the shapefile and organize by name (using multiple names to be thorough)
                            zipfile.on("end", function () { return (0, shapefile_1.read)(shpStream, dbfStream, { encoding: "UTF-8" }).then(function (source) { return resolve(source); }); });
                        });
                    })];
                case 1: return [2 /*return*/, _a.sent()];
            }
        });
    });
}
/** Fetch, parse, and organize sovereign countries from https://www.naturalearthdata.com/ by name */
function getNaturalEarthData() {
    return __awaiter(this, void 0, void 0, function () {
        var naturalEarthResponse, naturalEarthBuffer, collection, _i, _a, feature;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0: return [4 /*yield*/, fetch(NATURAL_EARTH_URL)];
                case 1:
                    naturalEarthResponse = _b.sent();
                    return [4 /*yield*/, naturalEarthResponse.arrayBuffer()];
                case 2:
                    naturalEarthBuffer = _b.sent();
                    return [4 /*yield*/, readShapefileZip(naturalEarthBuffer)];
                case 3:
                    collection = _b.sent();
                    for (_i = 0, _a = collection.features; _i < _a.length; _i++) {
                        feature = _a[_i];
                        if (feature.properties) {
                            feature.properties = {
                                names: fix_null_string(feature.properties.NAME),
                                geounit: fix_null_string(feature.properties.GEOUNIT),
                                sovereign: fix_null_string(feature.properties.SOVEREIGNT)
                            };
                        }
                    }
                    return [2 /*return*/, collection.features.reduce(function (obj, cur) {
                            var _a, _b, _c;
                            // Create lookup dictionaries based on name, geounit, and sovereign name properties of the data
                            var name = (_a = cur.properties) === null || _a === void 0 ? void 0 : _a.name;
                            var geounit = (_b = cur.properties) === null || _b === void 0 ? void 0 : _b.geounit;
                            var sovereign = (_c = cur.properties) === null || _c === void 0 ? void 0 : _c.sovereign;
                            obj.name[name] = __spreadArray(__spreadArray([], (obj.name[name] || []), true), [cur], false);
                            obj.geounit[geounit] = __spreadArray(__spreadArray([], (obj.geounit[geounit] || []), true), [cur], false);
                            obj.sovereign[sovereign] = __spreadArray(__spreadArray([], (obj.sovereign[sovereign] || []), true), [cur], false);
                            return obj;
                        }, { name: {}, geounit: {}, sovereign: {} })];
            }
        });
    });
}
/** Fetch, parse, and organize sovereign countries from https://www.naturalearthdata.com/ by name */
function getMexicanStates() {
    return __awaiter(this, void 0, void 0, function () {
        var naturalEarthResponse, naturalEarthBuffer, collection, result;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, fetch(MEXICAN_STATES_URL)];
                case 1:
                    naturalEarthResponse = _a.sent();
                    return [4 /*yield*/, naturalEarthResponse.arrayBuffer()];
                case 2:
                    naturalEarthBuffer = _a.sent();
                    return [4 /*yield*/, readShapefileZip(naturalEarthBuffer)];
                case 3:
                    collection = _a.sent();
                    result = collection.features.filter(function (feature) { return feature.properties.iso_a2 === 'MX'; }).map(function (feature) { return (__assign(__assign({}, feature), { properties: {
                            name: fix_null_string(feature.properties.name),
                        } })); });
                    return [2 /*return*/, result.reduce(function (obj, cur) {
                            var _a;
                            var _b;
                            return (__assign((_a = {}, _a[(_b = cur.properties) === null || _b === void 0 ? void 0 : _b.name] = cur, _a), obj));
                        }, {})];
            }
        });
    });
}
// Transform the advisory data to have consistent names and the data we need
function transformData(advisories) {
    return advisories.map(function (advisory) {
        var name, level;
        if (advisory.title.startsWith("See State Summaries")) {
            name = "Mexico";
            level = advisory.title.split(" - ")[1];
        }
        else if (advisory.title.startsWith("See Summaries - Mainland China")) {
            name = "China";
            level = advisory.title.split(" - ")[2];
        }
        else if (advisory.title.startsWith("See Individual Summaries")) {
            name = "Israel";
            level = advisory.title.split(" - ")[1];
        }
        else {
            name = advisory.title.split(" - ")[0];
            level = advisory.title.split(" - ")[1];
        }
        level = level.replace(/Level (\d):.*/, "$1");
        return {
            name: name,
            level: parseInt(level),
            link: advisory.id,
            summary: advisory.summary,
            published: advisory.published,
            updated: advisory.updated,
        };
    });
}
Promise.all([
    getNaturalEarthData(),
    getMexicanStates(),
    getStateDepartmentData()
        .then(function (advisories) { return transformData(advisories.feed.entry); })
]).then(function (_a) {
    var geometry = _a[0], mexican_states = _a[1], advisories = _a[2];
    var features = [];
    var _loop_1 = function (area) {
        var name_1 = (LOOKUPS[area.name] || area.name).trim();
        if (name_1 === "Mexico") {
            var stateSummarySection = area.summary.substring(area.summary.indexOf("<p><b><u>"));
            var stateSummaries = stateSummarySection.replace(/\n/g, '').split("</p><p><b><u>");
            stateSummaries = stateSummaries.map(function (summary) {
                var name = summary.split(/( state| \([A-Za-z ]+\))(\s|&nbsp;)– /)[0].replace("<p><b><u>", "");
                name = MEXICO_LOOKUPS[name] || name;
                var match = mexican_states[name];
                if (match) {
                    match.properties = {
                        name: name,
                        level: LEVEL_TEXT_TO_NUMBER[summary.replace(/.*(\s|&nbsp;)– ([A-Za-z ]+)<\/u>.*/, "$2")],
                        summary: summary.substring(summary.indexOf("</u></b></p>") + "</u></b></p>".length),
                        link: area.link
                    };
                    features.push(match);
                }
                else {
                    console.log("Couldn't find match for", name);
                }
            });
            return "continue";
        }
        // Look based on name first, then geounit, then sovereign
        // (matching only on sovereign can lead to e.g. tiny islands being chosen for Australia)
        var match = geometry.name[name_1] || geometry.geounit[name_1] || geometry.sovereign[name_1];
        if (match) {
            if (match.length > 1) {
                console.error("Found multiple matches for", name_1);
            }
            var feature = match[0];
            feature.properties = area;
            features.push(feature);
        }
        else {
            console.error("couldn't find match for \"" + name_1 + "\"");
        }
    };
    // Iterate through advisories and find the matching geometry
    for (var _i = 0, advisories_1 = advisories; _i < advisories_1.length; _i++) {
        var area = advisories_1[_i];
        _loop_1(area);
    }
    (0, fs_1.writeFileSync)('src/countries-with-advisories.json', JSON.stringify({ type: 'FeatureCollection', features: features }));
});
