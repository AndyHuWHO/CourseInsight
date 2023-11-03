// This file contains functions to unzip files, parse JSON content, or perform other file-related tasks.

// "use strict";

import fs, {promises as fsPromises} from "fs";
import JSZip from "jszip";
import {join} from "path";
import {InsightError} from "../controller/IInsightFacade";
import Section from "../models/Section";
import Room from "../models/Room";

export default {
	writeSectionsToFile: writeRoomsToFile,
	ensureDataFolderExists,
	loadDataFolderFileNames,
	sortFilenamesChronologically,
	extractDatasetIdFromFilename,
};

// REQUIRES: id of dataset at string and Section array
// EFFECTS: writes room dataset to file ./data (persistence)
export async function writeRoomsToFile(id: string, rooms: Room[]): Promise<void> {
	try {
		// constructs path to data folder
		const persistDir = "./data";
		// const dataFolder = join(__dirname, "..", "data");
		await ensureDataFolderExists(persistDir);

		// // get existing file names in the ./data folder to maintain chronological order of when dataset was added
		// const curFiles = await fsPromises.readdir(dataFolder);
		// // naming convention to keep track of the order/when the next data set
		// const prefix = curFiles.length + 1;

		// Uses a timestamp as a prefix for the filename to ensure unique chronological order
		// returns Unix time stamp format
		const timestamp = Date.now();
		// constructs full path where new JSON file is to be stored
		// it appends filename for JSON file as timestamp_id.json - "1627922239000_something.json" with path from
		// earlier
		const outputPath = join(persistDir, `${timestamp}_${id}.json`);
		// instructs file system to write a file to the path specified as outputPath
		// with data serialized into JSON string from sections
		// JSON string is a stringified representation of a JSON object used for transmitting the data as a string
		await fsPromises.writeFile(outputPath, JSON.stringify(rooms));
	} catch (error) {
		console.error(`Failed to write sections to file: ${error}`);
		throw new InsightError("Error occurred while writing sections to file.");
	}
}

// REQUIRES: string
// EFFECTS: checks if there is access to dataFolder, if not, creates one
async function ensureDataFolderExists(dataFolder: string): Promise<void> {
	try {
		await fsPromises.access(dataFolder);
	} catch (error) {
		try {
			await fsPromises.mkdir(dataFolder);
		} catch (mkdirError) {
			// Catching any errors on directory creation, such as if the directory already exists.
			console.error(`Error creating directory: ${mkdirError}`);
		}
	}
}

// REQUIRES: path to data folder as string
// EFFECTS: returns an array of strings that are filenames from the ./data folder
export async function loadDataFolderFileNames(dataFolder: string): Promise<string[]> {
	try {
		return await fsPromises.readdir(dataFolder);
	} catch (error) {
		console.error(`Failed to read filenames from data folder: ${error}`);
		throw error;
	}
}

// REQUIRES: array of strings representing file names
// EFFECTS: returns array of file names in ascending chronological order
export function sortFilenamesChronologically(filenames: string[]): string[] {
	return filenames.sort((a, b) => {
		const timestampA = parseInt(a.split("_")[0], 10);
		const timestampB = parseInt(b.split("_")[0], 10);
		return timestampA - timestampB;
	});
}

// REQUIRES: a file name as string ex: "1627922239000_ubc", utilizing unix time stamp format
// EFFECTS: parses file name to retrieve dataset id name and returns dataset id name
export function extractDatasetIdFromFilename(filename: string): string {
	const parts = filename.split("_");
	return parts.slice(1).join("_").replace(".json", "");
}

// REQUIRES: path to file as string
// EFFECTS: converts JSON string in .json file to a room object
export async function loadRoomDatasetContent(filePath: string): Promise<Room[]> {
	try {
		// read file content as a string
		const rawData = await fsPromises.readFile(filePath, "utf-8");

		// parse the string into a JSON object
		const data = JSON.parse(rawData);

		// map the object to an array of Room instances
		return data.map(
			(roomData: any) =>
				new Room(
					roomData.fullname,
					roomData.shortname,
					roomData.number,
					roomData.address,
					Number(roomData.lat),
					Number(roomData.lon),
					Number(roomData.seats),
					roomData.type,
					roomData.furniture,
					roomData.string
				)
		);
	} catch (error) {
		// console.error(`Failed to reload dataset content from ${filePath}: ${error}`);
		throw new InsightError("Error occurred while reloading dataset content.");
	}
}
