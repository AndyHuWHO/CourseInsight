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
	private persistDir = "./data";

	private datasets: Dataset[];
	private datasetsId: string[];
	private isLoaded: boolean;

	constructor() {
		console.log("InsightFacadeImpl::init()");
		this.datasets = [];
		this.datasetsId = [];
		this.isLoaded = false; // if false = datasets are not initialized (loaded) from file
	}

	// REQUIRES: id of the dataset being added. Follows the format /^[^_]+$/
	// 			 content  The base64 content of the dataset. This content should be in the form of a serialized zip file.
	// 			 kind  The kind of the dataset
	// MODIFIES: this
	// EFFECTS: returns Promise <string[]; promise fulfill on a successful add, reject for any failures.
	// string[] contains the ids of all currently added datasets upon a successful add.
	// The promise should reject with an InsightError describing the error.
	public async addDataset(id: string, content: string, kind: InsightDatasetKind): Promise<string[]> {
		try {
			// If datasets not loaded, wait until they are
			if (!this.isLoaded) {
				await this.initializeDatasets();
				this.isLoaded = true;
			}

			// Validate ID is syntactically valid
			if (!ValidationUtil.isValidSyntaxID(id)) {
				throw new InsightError("Invalid syntax for ID");
			}

			// Check if ID is unique/does not already belong in loaded datasets
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

			return this.datasetsId;
		} catch (error) {
			console.error("Error adding dataset:", error);
			throw new InsightError("Error occurred while adding dataset.");
		}
	}

	// REQUIRES: id of the dataset to remove. Follows the format /^[^_]+$/
	// MODIFIES: this
	// EFFECTS: returns Promise<string>, promise should fulfill upon a successful removal, reject on any error.
	public async removeDataset(id: string): Promise<string> {
		try {
			// If datasets not loaded, wait until they are
			if (!this.isLoaded) {
				await this.initializeDatasets();
				this.isLoaded = true;
			}

			// Validate ID is syntactically valid
			if (!ValidationUtil.isValidSyntaxID(id)) {
				throw new InsightError("Invalid syntax for ID");
			}

			// Validate ID to remove exists in ./data file
			if (!this.datasetsId.includes(id)) {
				throw new NotFoundError("Id does not exist");
			}

			// Remove the dataset from internal storage
			this.datasets = this.datasets.filter((dataset) => dataset.id !== id);
			this.datasetsId = this.datasetsId.filter((datasetId) => datasetId !== id);

			// Remove the dataset from file ./data

			// const dataFolder = join(__dirname, "..", "data");
			const filenameRegex = new RegExp(`_${id}.json$`); // regex code from chatGPT

			// grab files from the ./data folder
			const filenames = await FileUtil.loadDataFolderFileNames(this.persistDir);

			// regex fn from chatGPT
			// iterate over array of files and use regex to find particular file(dataset) requested to delete
			const fileToDelete = filenames.find((filename) => filenameRegex.test(filename));

			if (!fileToDelete) {
				throw new InsightError("File corresponding to ID not found");
			}

			// attempt to delete identified file
			await fs.promises.unlink(join(this.persistDir, fileToDelete));
			return id;
		} catch (error) {
			console.error("Error removing dataset:", error);
			// If error is of type InsightError or NotFoundError, rethrow it to keep its message
			// from chatGPT
			if (error instanceof InsightError || error instanceof NotFoundError) {
				throw error;
			} else {
				// Otherwise, throw a generic InsightError
				throw new InsightError("Error occurred while removing dataset.");
			}
		}
	}

	public performQuery(query: unknown): Promise<InsightResult[]> {
		// if(!this.queryValidator.validateQuery(query)) {
		// 	return Promise.reject("Query not valid.");
		// }
		return Promise.reject("perform Not implemented.");
	}

	// EFFECTS: returns Promise <InsightDataset[]>, list all currently added datasets, their types, and number of rows.
	// The promise should fulfill an array of currently added InsightDatasets, and will only fulfill.
	public async listDatasets(): Promise<InsightDataset[]> {
		// console.log("printing datasets before loading");
		// console.log(this.datasets);
		// console.log("printing isLoaded prior to isLoaded check in listDatasets");
		// console.log(this.isLoaded);

		if (!this.isLoaded) {
			await this.initializeDatasets();
			this.isLoaded = true;
		}
		// console.log("printing isLoaded after isLoaded check in listDatasets");
		// console.log(this.isLoaded);
		// console.log("printing datasets after loading");
		// console.log(this.datasets);

		// create new array of InsightDataset[] with only id, kind and numRows of Dataset object
		// literal objects that conform to structure of interface InsightDataset will be considered of that type
		const insightDatasets: InsightDataset[] = this.datasets.map((dataset) => {
			return {
				id: dataset.id,
				kind: dataset.kind,
				numRows: dataset.numRows,
			};
		});
		// console.log("printing insightDatasets");
		// console.log(insightDatasets);  // Log the final state before returning
		return Promise.resolve(insightDatasets);
	}

	private async initializeDatasets(): Promise<void> {
		// const dataFolderPath = join(__dirname, "..", "data");

		// Check if the data folder exists before attempting to load datasets
		if (fs.existsSync(this.persistDir)) {
			// console.log("DATASET EXISTS");
			await this.loadDatasets(this.persistDir);
		} else {
			console.warn("Data folder does not exist. Initializing with empty datasets.");
		}
	}

	private async loadDatasets(dataFolderPath: string): Promise<void> {
		try {
			// Load filenames using helper function
			const filenames = await FileUtil.loadDataFolderFileNames(dataFolderPath);
			// Sort filenames in chronological order using helper function
			const sortedFilenames = FileUtil.sortFilenamesChronologically(filenames);

			const loadDatasetPromises = sortedFilenames.map(async (filename) => {
				// Extract dataset id and load it into datasetsId array using helper function
				const id = FileUtil.extractDatasetIdFromFilename(filename);

				// Load the dataset content
				const datasetPath = join(dataFolderPath, filename);
				const sections: Section[] = await FileUtil.loadDatasetContent(datasetPath);

				// Create Dataset object and push it to this.datasets
				// Assuming kind is always 'Courses'
				const newDataset = new Dataset(id, InsightDatasetKind.Sections, sections.length, sections);

				return {newDataset, id};
			});

			const loadedDatasets = await Promise.all(loadDatasetPromises);

			// Push the loaded datasets and ids into their respective arrays
			loadedDatasets.forEach(({newDataset, id}) => {
				this.datasets.push(newDataset);
				this.datasetsId.push(id);
			});
		} catch (error) {
			console.error(`Failed to load datasets: ${error}`);
			throw new Error("loadDatasets failed.");
		}
	}
}
