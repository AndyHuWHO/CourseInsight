import {
	IInsightFacade,
	InsightDataset,
	InsightDatasetKind,
	InsightError,
	InsightResult,
	NotFoundError,
} from "./IInsightFacade";
import {Dataset} from "../models/Dataset";
import * as FileUtil from "../util/FileUtil";
import ValidationUtil from "../util/ValidationUtil";
import {join} from "path";
import Section from "../models/Section";
import fs from "fs";


/**
 * This is the main programmatic entry point for the project.
 * Method documentation is in IInsightFacade
 *
 */

export default class InsightFacade implements IInsightFacade {
	private datasets: InsightDataset[];
	private datasetsId: string[];

	constructor() {
		console.log("InsightFacadeImpl::init()");
		this.datasets = [];
		this.datasetsId = [];
		this.initializeDatasets();
	}

	// REQUIRES: id, content, kind
	// MODIFIES: this
	// EFFECTS:
	public async addDataset(id: string, content: string, kind: InsightDatasetKind): Promise<string[]> {
		// does ID already exist in datasets !!!
		try {

			// Validate ID is syntactically valid
			if (!ValidationUtil.isValidSyntaxID(id)) {
				throw new InsightError("Invalid syntax for ID");
			}

			// Check if ID is unique
			if (!ValidationUtil.isUniqueId(id, this.datasetsId)) {
				throw new InsightError("ID already exists.");
			}

			// Validate content as a base64 zip string
			if (!(await ValidationUtil.isValidZipBase64(content))) {
				throw new InsightError("Invalid Zip Base64 content");
			}

			// Validate kind should be sections
			if (!ValidationUtil.isValidKind(kind)) {
				throw new InsightError("Invalid InsightDatasetKind");
			}

			const zipContent = await FileUtil.unZipBase64(content);
			const sections = await FileUtil.extractSectionsFromUnZip(zipContent);
			await FileUtil.writeSectionsToFile(id, sections);

			// create a new Dataset and add it to the datasets array
			const newDataset = new Dataset(id, kind, sections.length, sections);
			this.datasets.push(newDataset);
			this.datasetsId.push(id);

			return [id];
		} catch (error) {
			console.error("Error adding dataset:", error);
			throw new InsightError("Error occurred while adding dataset.");
		}
	}

	public removeDataset(id: string): Promise<string> {
		return Promise.reject("Not implemented.");
	}

	public performQuery(query: unknown): Promise<InsightResult[]> {
		return Promise.reject("Not implemented.");
	}

	public listDatasets(): Promise<InsightDataset[]> {
		// list data set I need to make sure I get rid of the X_" !!!
		return Promise.reject("Not implemented.");
	}

	private async initializeDatasets(): Promise<void> {
		const dataFolderPath = join(__dirname, "..", "data");

		// Check if the data folder exists before attempting to load datasets
		if (fs.existsSync(dataFolderPath)) {
			await this.loadDatasets(dataFolderPath);
		} else {
			console.warn("Data folder does not exist. Initializing with empty datasets.");
		}
	}

	private async loadDatasets(dataFolderPath: string): Promise<void> {
		try{
			// Construct the path to the data folder
			const dataFolder = join(__dirname, "..", "data");
			// Load filenames using helper function
			const filenames = await FileUtil.loadDataFolderFileNames(dataFolderPath);
			// Sort filenames in chronological order using helper function
			const sortedFilenames = FileUtil.sortFilenamesChronologically(filenames);

			// // Extract dataset id and load it into datasetsId array using helper function
			// this.datasetsId = sortedFilenames.map((filename: any) => FileUtil.extractDatasetIdFromFilename(filename));

			// Loop through each filename, load content, parse it and create Dataset objects
			for (const filename of sortedFilenames) {
				// Extract dataset id and load it into datasetsId array using helper function
				const id = FileUtil.extractDatasetIdFromFilename(filename);
				this.datasetsId.push(id);

				// Load the dataset content
				const datasetPath = join(dataFolder, filename);
				const sections: Section[] = await FileUtil.loadDatasetContent(datasetPath);

				// Create Dataset object and push it to this.datasets
				// Assuming kind is always 'Courses'
				const newDataset = new Dataset(id, InsightDatasetKind.Sections, sections.length, sections);
				this.datasets.push(newDataset);
			}

		} catch (error) {
			console.error(`Failed to load datasets: ${error}`);
			return Promise.reject("loadDatasets failed.");
		}
	}
}
