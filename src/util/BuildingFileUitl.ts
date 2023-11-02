import {InsightError} from "../controller/IInsightFacade";
import {parse} from "parse5";
import JSZip from "jszip";
import {join} from "path";
import Section from "../models/Section";
import Room from "../models/Room";
import Building from "../models/Building";
import {
	findTableByTdClasses,
	findAllElementsByTag,
	hasAllClassPairs,
	hasClassPair,
	getTextFromTd,
	getHrefFromTd,
} from "./IndexFileUtil";

// The classes that identify the building table in index.htm
const tdBuildingClasses: string[][] = [
	["views-field", "views-field-field-room-number"], // number: string
	["views-field", "views-field-field-room-capacity"], // seats: number
	["views-field", "views-field-field-room-type"], // type: string
	["views-field", "views-field-field-room-furniture"], // furniture: string
];

const teamNumber = "149";

export async function extractRoomsFromBuilding(unzipContent: JSZip, building: Building): Promise<Room[]> {
	// get relative path fo the building's .htm file from its Building object
	// assume it exists as a check was done at line 197 of IndexFileUtil.
	// if (!building.buildingHREF) {
	// 	console.warn(`buildingHREF found for building: ${building.shortName}`);
	// 	continue;
	// }
	const buildingPath = building.buildingHREF;

	// for (let fileName in unzipContent.files) {
	// 	console.log(fileName);
	// }

	// find the corresponding .htm file in the unzipped content
	const buildingFile = unzipContent.file(buildingPath);
	if (!buildingFile) {
		console.warn(`building file not found for ${buildingPath}`);
		return []; // skip to the next building if file not found
	}

	// convert building's .htm file to html string
	const buildingHtmlContent = await buildingFile.async("string");

	// parse html string and create buildingDOMTree
	const buildingDOMTree = parse(buildingHtmlContent);

	// find the table with the room information based on <td> classes
	const roomTable = findTableByTdClasses(buildingDOMTree, tdBuildingClasses);
	if (!roomTable) {
		return []; // skip to the next building if no table is found
	}
	// console.log("printing roomTable");
	// console.log(roomTable);

	// get geolocation data once I have verified table
	const geolocation = await getGeolocation(building.address);

	if (geolocation.error) {
		console.warn(`Geolocation error for ${building.address}: ${geolocation.error}`);
		return []; // Skip this room if geolocation data is not available
	}

	// extract room info from roomTable
	const rooms = await extractRoomsFromBuildingTable(roomTable, building, geolocation);

	console.log("finished traversing index.htm and building files, printing all the rooms");
	console.log(rooms);
	return rooms;
}

async function extractRoomsFromBuildingTable(tableNode: any, building: Building, geoloc: Geolocation): Promise<Room[]> {
	const rooms: Room[] = [];
	// get all table row 'tr' elements = each row represents a room
	const trElements: any[] = findAllElementsByTag(tableNode, "tr");

	const numberClasses = ["views-field", "views-field-field-room-number"];
	const seatClasses = ["views-field", "views-field-field-room-capacity"];
	const typeClasses = ["views-field", "views-field-field-room-type"];
	const furnitureClasses = ["views-field", "views-field-field-room-furniture"];
	const hrefClasses1 = numberClasses;
	const hrefClasses2 = ["views-field", "views-field-nothing"];

	// iterate through table rows
	for (const tr of trElements) {
		// grab all cells 'td' elements per row, each td together is for one room
		const tdElements = findAllElementsByTag(tr, "td");

		if (tdElements.length >= 4 && hasAllClassPairs(tdElements, tdBuildingClasses)) {
			const numberTd = tdElements.find((td) => hasClassPair(td, numberClasses));
			const seatTd = tdElements.find((td) => hasClassPair(td, seatClasses));
			const typeTd = tdElements.find((td) => hasClassPair(td, typeClasses));
			const furnitureTd = tdElements.find((td) => hasClassPair(td, furnitureClasses));

			if (numberTd && seatTd && typeTd && furnitureTd) {
				const number = getTextFromTd(numberTd);
				const seat = getNumberFromTd(seatTd);
				const type = getTextFromTd(typeTd);
				const furniture = getTextFromTd(furnitureTd);

				const hrefTd =
					tdElements.find((td) => hasClassPair(td, hrefClasses1)) ||
					tdElements.find((td) => hasClassPair(td, hrefClasses2));
				let href = hrefTd ? getHrefFromTd(hrefTd) : null;

				if (!href) {
					// !!! do i need to throw error or do i not add this room?
					return [];
					// throw new Error("href not found for building: ${fullName}");
				}
				const room = new Room(
					building.fullName,
					building.shortName,
					number,
					building.address,
					geoloc.lat ?? 0,
					geoloc.lon ?? 0,
					seat,
					type,
					furniture,
					href
				);
				rooms.push(room);
			}
		}
	}
	return rooms;
}

// Helper that returns <a> tag's text as a number if found, otherwise return the first #text node's value as a number
function getNumberFromTd(tdNode: any): number {
	if (!tdNode.childNodes) {
		return 0;
	}

	let textValue: string | null = null;

	// Loop to find <a> tag
	for (let node of tdNode.childNodes) {
		if (node.nodeName === "a") {
			// Loop through child nodes of the <a> tag to find a text node
			for (let aChild of node.childNodes) {
				if (aChild.nodeName === "#text" && "value" in aChild) {
					// Return if <a> tag's text is found and convert it to number
					return parseInt(aChild.value.trim(), 10);
				}
			}
		} else if (node.nodeName === "#text" && "value" in node && textValue === null) {
			textValue = node.value.trim();
		}
	}

	// Convert the text value to a number
	return textValue ? parseInt(textValue, 10) : 0;
}

interface Geolocation {
	lat?: number;
	lon?: number;
	error?: string;
}

async function getGeolocation(address: string): Promise<Geolocation> {
	// encode address
	const encodedAddress = encodeURIComponent(address);
	// construct the URL
	const url = `http://cs310.students.cs.ubc.ca:11316/api/v1/project_team${teamNumber}/${encodedAddress}`;
	// make get request
	const response = await fetch(url);

	// throw an error if response not ok
	if (!response.ok) {
		throw new InsightError("failed to fetch geolocation, invalid room");
	}

	// handle the response (chatGPT help)
	const data: Geolocation = await response.json();
	return data;
}
