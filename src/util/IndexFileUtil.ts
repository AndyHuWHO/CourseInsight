// This file contains functions to unzip files, parse html content, or perform other file-related tasks for rooms

// "use strict";

import fs, {promises as fsPromises} from "fs";
import JSZip from "jszip";
import {join} from "path";
import {InsightError} from "../controller/IInsightFacade";
import Section from "../models/Section";
import Room from "../models/Room";
import {parse} from "parse5";
import Building from "../models/Building";
import {extractRoomsFromBuilding} from "./BuildingFileUitl";

export default {
	extractRoomsFromUnzip,
};

let buildingFileNamesSet: Set<string>;

// The classes that identify the building table in index.htm
const tdIndexClasses: string[][] = [
	["views-field", "views-field-title"],
	["views-field", "views-field-field-building-code"],
	["views-field", "views-field-field-building-address"],
];

// REQUIRES: JSZip object
// EFFECTS: extracts and parses htm files to return an array of Room objects
export async function extractRoomsFromUnzip(unzipContent: JSZip): Promise<Room[]> {
	// check if index.htm is at the root, its existence means well-formatted html
	const indexFile = unzipContent.file("index.htm");
	if (!indexFile) {
		throw new InsightError("index.html file not at the root");
	}

	// check for nested campus folder structure !!! don't need to check nested folder file structure
	const buildingsFolderPath = "campus/discover/buildings-and-classrooms/";
	const buildingsFolder = unzipContent.folder(buildingsFolderPath);
	if (!buildingsFolder) {
		throw new InsightError("path to building folder not found");
	}

	// check if buildings-and-classrooms folder contains any .htm files. adapted code from chatGPT
	// returns array of file paths/file objects that end with .htm
	// use to filter for buildings to parse in index.htm table
	const buildingFiles = buildingsFolder.filter((relativePath, file) => /\.htm$/i.test(relativePath));
	if (buildingFiles.length === 0) {
		throw new Error(`No .htm files found in ${buildingsFolderPath}`);
	}

	// use to track when to create a new Building object
	buildingFileNamesSet = new Set(buildingFiles.map((file) => file.name));
	// console.log(buildingFileNamesSet);

	// parse index.htm file to find building information
	// tells jszip to read contents of index.htm as plain text
	const indexHtmlContent = await indexFile.async("string");
	// parse takes the HTML string and parses it creating a DOM tree
	const indexDOMTree = parse(indexHtmlContent);
	// console.log(indexDOMTree);

	// find the table with the building information based on <td> classes else throw error if no table found
	const buildingTable = findTableByTdClasses(indexDOMTree, tdIndexClasses);
	if (!buildingTable) {
		throw new InsightError("building table not found in index.htm");
	}
	// console.log(buildingTable.childNodes[1]);

	// extract building information from the table and return array of Building objects
	const buildings = extractBuildingsFromIndexTable(buildingTable);
	// console.log(buildings);

	const roomsPromises = buildings.map((building) => extractRoomsFromBuilding(unzipContent, building));
	const roomsArrays = await Promise.all(roomsPromises);

	const rooms: Room[] = [];
	for (const roomsInBuilding of roomsArrays) {
		rooms.push(...roomsInBuilding);
	}

	if (rooms.length === 0) {
		throw new InsightError("dataset has no valid rooms");
	}
	console.log("printing all rooms");
	console.log(rooms);
	return rooms;
}

// Helper function to find all elements of a specific tag within a parent element (help from chatGPT)
export function findAllElementsByTag(node: any, tagName: string): any[] {
	let elements: any[] = [];
	const queue: any[] = [node];
	while (queue.length > 0) {
		const current: any | undefined = queue.shift();
		if (current) {
			if ("tagName" in current && current["tagName"] === tagName) {
				elements.push(current);
			}
			if (current.childNodes) {
				queue.push(...current.childNodes);
			}
		}
	}
	return elements;
}

// helper checks if given <td> element has given specific pair of classes in attrs[{name, value}] (help from chatGPT)
export function hasClassPair(td: any, classPairs: string[]): boolean {
	return (
		"attrs" in td &&
		classPairs.every((cls) =>
			td["attrs"].some((attr: {name: string; value: string}) => attr.name === "class" && attr.value.includes(cls))
		)
	);
}

// helper checks if set of td elements collectively contain all specified pairs of classes (help from chatGPT)
export function hasAllClassPairs(tdElements: any[], classes: string[][]): boolean {
	let foundPairs = new Set<number>();

	for (const td of tdElements) {
		classes.forEach((clsPair, index) => {
			if (hasClassPair(td, clsPair)) {
				foundPairs.add(index);
			}
		});
	}

	return foundPairs.size === classes.length;
}

// BFS because elements of similar purpose often at same depth, and table elements might not usually be deeply
// nested which allows for early discovery
// classes = array of strings representing classes looking for in <td> elements
// Helper function to find desired table based on <td> classes (help from chatGPT)
// returns node representing table or null if not found
export function findTableByTdClasses(node: any, classes: string[][]): any | null {
	const queue: any[] = [node];
	while (queue.length > 0) {
		const element = queue.shift();
		// check for <table>
		if (element && "tagName" in element && element["tagName"] === "table") {
			// find all td nodes within parent node
			const tdElements: any[] = findAllElementsByTag(element, "td");
			// console.log(tdElements[0].childNodes);

			// help from chatGPT: check if table contains at least one <td> element that has all the
			// specified combinations of classes as defined in tdIndexClasses. If such a table is found,
			// it returns that table element.
			if (hasAllClassPairs(tdElements, classes)) {
				return element;
			}
		}
		if (element?.childNodes) {
			queue.push(...element.childNodes);
		}
	}
	return null;
}

// helper to extract building information from index.htm table (adapted from chatGPT)
export function extractBuildingsFromIndexTable(tableNode: any): Building[] {
	const buildings: Building[] = [];
	// get all table row 'tr' elements = each row represents a building
	const trElements = findAllElementsByTag(tableNode, "tr");

	const fullNameClasses = ["views-field", "views-field-title"];
	const shortNameClasses = ["views-field", "views-field-field-building-code"];
	const addressClasses = ["views-field", "views-field-field-building-address"];
	const hrefClasses1 = fullNameClasses;
	const hrefClasses2 = ["views-field", "views-field-nothing"];

	// iterate though table rows
	for (const tr of trElements) {
		// grab all cells 'td' elements per row, each td together is for one building
		const tdElements: any[] = findAllElementsByTag(tr, "td");

		if (tdElements.length >= 3 && hasAllClassPairs(tdElements, tdIndexClasses)) {
			const fullNameTd = tdElements.find((td) => hasClassPair(td, fullNameClasses));
			const shortNameTd = tdElements.find((td) => hasClassPair(td, shortNameClasses));
			const addressTd = tdElements.find((td) => hasClassPair(td, addressClasses));

			if (fullNameTd && shortNameTd && addressTd) {
				const fullName = getTextFromTd(fullNameTd);
				const shortName = getTextFromTd(shortNameTd);
				const address = getTextFromTd(addressTd);

				const hrefTd =
					tdElements.find((td) => hasClassPair(td, hrefClasses1)) ||
					tdElements.find((td) => hasClassPair(td, hrefClasses2));
				let href = hrefTd ? getHrefFromTd(hrefTd) : null;

				if (!href) {
					throw new Error("href not found for building: ${fullName}");
				}

				// Remove './' from the start of the href (regex from chatGPT)
				href = href.replace(/^\.\//, "");

				// const building = new Building(fullName, shortName, address, href);
				// buildings.push(building);

				if (buildingFileNamesSet.has(href)) {
					const building = new Building(fullName, shortName, address, href);
					buildings.push(building);
				}
			}
		}
	}
	return buildings;
}

// helper that returns <a> tag's text if found, otherwise return the first #text node's value
export function getTextFromTd(tdNode: any): string {
	if (!tdNode.childNodes) {
		return "";
	}

	let textValue: string | null = null;

	// loop to find <a> tag
	for (let node of tdNode.childNodes) {
		if (node.nodeName === "a") {
			// loop through child nodes of the <a> tag to find a text node
			for (let aChild of node.childNodes) {
				if (aChild.nodeName === "#text" && "value" in aChild) {
					return aChild.value.trim(); // return if <a> tag's text is found
				}
			}
		} else if (node.nodeName === "#text" && "value" in node && textValue === null) {
			textValue = node.value.trim();
		}
	}

	return textValue || "";
}

// helper that returns <a> tag's text if found, otherwise return the first #text node's value
export function getHrefFromTd(tdNode: any): string | null {
	if (!tdNode.childNodes) {
		return null;
	}

	for (let node of tdNode.childNodes) {
		if (node.nodeName === "a" && "attrs" in node) {
			for (let attr of node.attrs) {
				if (attr.name === "href") {
					return attr.value;
				}
			}
		}
	}

	return null;
}
