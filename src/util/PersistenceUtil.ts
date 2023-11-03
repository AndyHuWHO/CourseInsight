// REQUIRES: id of dataset at string and Section array
// EFFECTS: writes Section to file ./data (persistence)
import {InsightKind} from "../models/InsightKind";
import fs, {promises as fsPromises} from "fs";
import {InsightError} from "../controller/IInsightFacade";
import {join} from "path";
import Room from "../models/Room";

export async function writeInsightKindsToFile(id: string, insightKinds: InsightKind[]): Promise<void> {
	try {
		// constructs path to data folder
		const persistDir = "./data";
		// const dataFolder = join(__dirname, "..", "data");
		await ensureDataFolderExists(persistDir);

		// // get existing file names in the ./data folder to maintain chronological order of when dataset was added
		// const curFiles = await fsPromises.readdir(dataFolder);
		// // naming convention to keep track of the order/when the next data set
		// const prefix = curFiles.length + 1;

		// assumption is the same kind in the array
		let insightKind;
		if (insightKinds[0] instanceof Room) {
			insightKind = "Room";
		} else {
			insightKind = "Section";
		}

		// Uses a timestamp as a prefix for the filename to ensure unique chronological order
		// returns Unix time stamp format
		const timestamp = Date.now();
		// constructs full path where new JSON file is to be stored
		// it appends filename for JSON file as timestamp_id.json - "1627922239000_something.json" with path from
		// earlier
		const outputPath = join(persistDir, `${timestamp}_${id}_${insightKind}.json`);
		// instructs file system to write a file to the path specified as outputPath
		// with data serialized into JSON string from insightKinds
		// JSON string is a stringified representation of a JSON object used for transmitting the data as a string
		await fsPromises.writeFile(outputPath, JSON.stringify(insightKinds));
	} catch (error) {
		// console.error(`Failed to write sections to file: ${error}`);
		throw new InsightError("Error occurred while writing insightKinds to file.");
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
// adapted from chatGPT
export function extractDatasetIdFromFilename(filename: string): string {
	const parts = filename.split("_");
	// Remove the last two parts (type and ".json"), then join the rest to get the dataset ID
	return parts[1];
	// return parts.slice(1, -2).join("_");

	// const parts = filename.split("_");
	// return parts.slice(1).join("_").replace(".json", "");
}
