// This file contains functions to unzip files, parse JSON content, or perform other file-related tasks.

// "use strict";

import fs, {promises as fsPromises} from "fs";
import JSZip from "jszip";
import {join} from "path";
import {InsightError} from "../controller/IInsightFacade";
import Section from "../models/Section";

export default {
	unZipBase64,
	extractSectionsFromUnZip,
	writeSectionsToFile,
	ensureDataFolderExists,
	parseFileContent,
	loadDataFolderFileNames,
	sortFilenamesChronologically,
	extractDatasetIdFromFilename
};

// REQUIRES: content as base64 string
// EFFECTS: converts base64 to a buffer and loads the content using JSZip, returns JSZip object
export async function unZipBase64(content: string): Promise<JSZip> {

	try {
        // convert base64 to a buffer
		const buffer = Buffer.from(content, "base64");
        // unzip using JSZip
		return await new JSZip().loadAsync(buffer);
	} catch (error){
		console.error("Error", error);
		return Promise.reject(new InsightError("Error occurred while unzipping dataset."));
	}
}

// REQUIRES: JSZip object
// EFFECTS: extracts and parses files from "courses" folder from the unzipped content to return
//			an array of Section objects
export async function extractSectionsFromUnZip(unzipContent: JSZip): Promise<Section[]> {

	try {
		const folderName = "courses";
		const coursesFolder = unzipContent.folder(folderName);
        // throw error if empty zip file or folder is found called courses
		if (!coursesFolder) {
			throw new InsightError("Folder '${folderName}' is not found in the zip file");
		}

		console.log("printing courseFolder");
		console.log(coursesFolder);

		// define a pattern to filter files directly under 'courses/' and ignores those starting with a dot
		// which are system/hidden files and are not within a subfolder
		// ^${folderName}/: This ensures that only paths starting with (in this case) "courses/" are considered.
		// [^./]: Ensures that the next character after "courses/" is not a dot (.) or a forward slash (/),
		// 		   preventing selection of hidden files or files in subdirectories.
		// [^/]*$: Ensures that there are no more forward slashes (/) after the initial folder name, meaning it's not
		// 		  in a subfolder under "courses/" and that the string ends after a sequence of any characters except /.
		const courseFilePattern = new RegExp(`^${folderName}/[^./][^/]*$`); // Regex from ChatGPT

		// Using filter to extract the files as per the pattern and ensuring they are not directories.
		const courseFiles = unzipContent.filter((relativePath, file) => {
			return courseFilePattern.test(relativePath) && !file.dir;
		});

		console.log("printing courseFiles");
		console.log(courseFiles);

		if (courseFiles.length === 0) {
			throw new InsightError("No files found in course folder");
		}

        // iterate through all selected .txt files directly under courses folder
        // extraction should produce a valid section object for each valid section found
        // !!! not a txt file -> handle as a document?

        // sections hold all valid sections parsed from all processed files
		let sections: Section[] = [];

        // iterate over files and applies async file function
        // returns array of promises where each promise will resolve to a section[] (array of section objects)
		const sectionPromises: Array<Promise<Section[]>> = courseFiles.map(async (file) => {
            // asynchronous retrieval of file content as text
			const fileContent = await file.async("text");
            // parses the JSON formatted string into a JSON object
			const parsedData = JSON.parse(fileContent);
            // calls helper to parse relevant section data from 'result' key
			const parsedSections = parseFileContent(parsedData.result);

            // if no sections then throw InsightError
			if (parsedSections.length === 0) {
				throw new InsightError("No valid sections found");
			}
			return parsedSections;
		});

        // wait for all file promises to resolve, each inner array represents sections parsed from one file
		const allSections: Section[][] = await Promise.all(sectionPromises);
        // concatenate all sections into a single array
		sections = sections.concat(...allSections);

		if (sections.length === 0) {
			throw new InsightError("No valid sections found");
		}

		return sections;
	} catch (error) {
		console.error("Error with inValid JSON format, fetching file content or no sections:", error);
		return Promise.reject(new InsightError("Error occurred while parsing dataset."));
	}
}

// !!! check for ordering of dataset logic
// REQUIRES: id of dataset at string and Section array
// EFFECTS: writes Section to file ./data (persistence)
export async function writeSectionsToFile(id: string, sections: Section[]): Promise<void> {
	try {
        // constructs path to data folder
		const dataFolder = join(__dirname, "..", "data");
		await ensureDataFolderExists(dataFolder);

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
		const outputPath = join(dataFolder, `${timestamp}_${id}.json`);
        // instructs file system to write a file to the path specified as outputPath
        // with data serialized into JSON string from sections
		// JSON string is a stringified representation of a JSON object used for transmitting the data as a string
		await fsPromises.writeFile(outputPath, JSON.stringify(sections));
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
		await fsPromises.mkdir(dataFolder);
	}
}

	// REQUIRES: an array of any type
	// EFFECTS: parses relevant items within content of key and
	//			returns an array of Section objects
function parseFileContent(content: any[]): Section[] {
	const sections: Section[] = [];
		// for every section of a course file
	for (const item of content) {
		try {
				// object destructuring extracts properties from current section
				// and that property name is assigned to the variable name (Property: Variable)
			const {
				id: uuid,
				Course: id,
				Title: title,
				Professor: instructor,
				Subject: dept,
				Year: year,
				Avg: avg,
				Pass: pass,
				Fail: fail,
				Audit: audit,
			} = item;
				// check if all fields exist only and are not undefined
				// will pass if 0, false, or an empty string (not checking for correctness here)
			if (
				uuid !== undefined &&
					id !== undefined &&
					title !== undefined &&
					instructor !== undefined &&
					dept !== undefined &&
					year !== undefined &&
					avg !== undefined &&
					pass !== undefined &&
					fail !== undefined &&
					audit !== undefined
			) {
					// if all fields are valid then new Section is instantiated and added to sections
				sections.push(new Section(uuid, id, title, instructor, dept, Number(year), avg, pass, fail, audit));
			}
		} catch (err) {
				// Log and continue if a section failed parsing
			console.error("Failed to parse section:", err);
		}
	}
	return sections;
}

// REQUIRES: path to data folder as string
// EFFECTS: loads name of each file and returns as a string[]
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
// EFFECTS: parses file name to retrieve dataset id name and returns it
export function extractDatasetIdFromFilename(filename: string): string {
	const parts = filename.split("_");
	return parts.slice(1).join("_").replace(".json", "");
}

// REQUIRES: path to file as string
// EFFECTS: converts JSON string in .json file to a Section object
export async function loadDatasetContent(filePath: string): Promise<Section[]> {
	try {
		// Read file content as a string
		const rawData = await fsPromises.readFile(filePath, "utf-8");

		// Parse the string into a JSON object
		const data = JSON.parse(rawData);

		// Map the object to an array of Section instances
		return data.map((sectionData: any) => new Section(
			sectionData.uuid,
			sectionData.id,
			sectionData.title,
			sectionData.instructor,
			sectionData.dept,
			Number(sectionData.year),
			sectionData.avg,
			sectionData.pass,
			sectionData.fail,
			sectionData.audit
		));
	} catch (error) {
		console.error(`Failed to reload dataset content from ${filePath}: ${error}`);
		throw new InsightError("Error occurred while reloading dataset content.");
	}
}
