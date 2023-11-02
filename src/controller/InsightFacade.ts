import {
	IInsightFacade,
	InsightDataset,
	InsightDatasetKind,
	InsightError,
	InsightResult,
	NotFoundError,
} from "./IInsightFacade";
import {Dataset} from "../models/Dataset";
import * as SectionFileUtil from "../util/SectionFileUtil";
import ValidationUtil from "../util/ValidationUtil";
import {join} from "path";
import Section from "../models/Section";
import fs from "fs";
import {QueryValidator} from "../models/QueryValidator";
import {QueryEngine} from "../models/QueryEngine";
import * as IndexFileUtil from "../util/IndexFileUtil";
import * as RoomFileUtil from "../util/RoomFileUtil";
import * as PersistenceUtil from "../util/PersistenceUtil";

/**
 * This is the main programmatic entry point for the project.
 * Method documentation is in IInsightFacade
 *
 */

export default class InsightFacade implements IInsightFacade {
	private persistDir = "./data";

	private datasets: Dataset[]; // !!!
	private datasetsId: string[];
	private isLoaded: boolean;
	private queryValidator: QueryValidator;
	private queryEngine: QueryEngine = new QueryEngine();

	constructor() {
		console.log("InsightFacadeImpl::init()");
		this.datasets = [];
		this.datasetsId = [];
		this.isLoaded = false; // if false = datasets are not initialized (loaded) from file
		this.queryValidator = new QueryValidator();
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

			// // Validate kind should be InsightDataKind
			// if (!ValidationUtil.isValidKind(kind)) {
			// 	throw new InsightError("Invalid InsightDatasetKind");
			// }

			const zipContent = await SectionFileUtil.unZipBase64(content);

			let newDataset: Dataset | undefined;

			if (kind === InsightDatasetKind.Sections) {
				const sections = await SectionFileUtil.extractSectionsFromUnZip(zipContent);
				await PersistenceUtil.writeInsightKindsToFile(id, sections);
				// create a new Dataset and add it to the datasets array
				newDataset = new Dataset(id, kind, sections.length, sections);
			} else if (kind === InsightDatasetKind.Rooms) {
				console.log("about to enter extraRoomsFromUnzip");
				const rooms = await IndexFileUtil.extractRoomsFromUnzip(zipContent);
				console.log("just exited extraRoomsFromUnzip");
				await PersistenceUtil.writeInsightKindsToFile(id, rooms);
				newDataset = new Dataset(id, kind, rooms.length, rooms);
			} else {
				throw new InsightError("Error occurred while extracting from zip");
			}

			// Only push newDataset if it's defined
			if (newDataset) {
				this.datasets.push(newDataset);
				this.datasetsId.push(id);
			} else {
				// Handle the case when newDataset is not defined
				throw new InsightError("Failed to create a new dataset");
			}

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
			const filenameRegex = new RegExp(`_${id}_(Room|Section).json$`);

			// const filenameRegex = new RegExp(`_${id}.json$`); // regex code from chatGPT

			// grab files from the ./data folder
			const filenames = await PersistenceUtil.loadDataFolderFileNames(this.persistDir);

			// regex fn from chatGPT
			// iterate over array of files and use regex to find particular file(dataset) requested to delete
			const fileToDelete = filenames.find((filename) => filenameRegex.test(filename));

			// should throw notfounderror if internal id is not found in ./data folder
			if (!fileToDelete) {
				throw new NotFoundError("File corresponding to ID not found");
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

	public async performQuery(query: unknown): Promise<InsightResult[]> {
		try {
			if (!this.isLoaded) {
				await this.initializeDatasets();
				this.isLoaded = true;
			}
		} catch (error) {
			throw new InsightError("error loading dataset from disk");
		}
		this.queryValidator.validateQuery(query);
		const idString = this.queryValidator._idString;
		let datasetToQuery: Dataset;
		for (let dataset of this.datasets) {
			if (dataset.id === idString) {
				datasetToQuery = dataset;
				return this.queryEngine.queryDataset(datasetToQuery, query);
			}
		}
		return Promise.reject(new InsightError("Data set to query not found"));
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

		// create new array of InsightDataset[] with only id, kind and numRows of SectionDataset object
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
		console.log(this.persistDir);
		console.log(fs.existsSync(this.persistDir));
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
			const filenames = await PersistenceUtil.loadDataFolderFileNames(dataFolderPath);
			// Sort filenames in chronological order using helper function
			const sortedFilenames = PersistenceUtil.sortFilenamesChronologically(filenames);

			const loadDatasetPromises = sortedFilenames.map(async (filename) => {

				// extract dataset id from filename
				const id = PersistenceUtil.extractDatasetIdFromFilename(filename);

				// extract dataset type (Room or Section) from filename (help from chatGPT)
				const parts = filename.split("_");
				const type = parts[parts.length - 1].replace(".json", "");

				// Load the dataset content
				const datasetPath = join(dataFolderPath, filename);
				let datasetContent;
				let datasetKind;
				if (type === "Room") {
					datasetContent = await RoomFileUtil.loadRoomDatasetContent(datasetPath);
					datasetKind = InsightDatasetKind.Rooms;
				} else {
					datasetContent = await SectionFileUtil.loadSectionDatasetContent(datasetPath);
					datasetKind = InsightDatasetKind.Sections;
				}

				// const sections: Section[] = await SectionFileUtil.loadDatasetContent(datasetPath);

				// Create dataset object and push it to this.datasets
				const newDataset = new Dataset(id, datasetKind, datasetContent.length, datasetContent);

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
