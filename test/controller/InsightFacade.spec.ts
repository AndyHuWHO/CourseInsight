import {
	IInsightFacade,
	InsightDatasetKind,
	InsightError,
	InsightResult, NotFoundError,
	ResultTooLargeError,
} from "../../src/controller/IInsightFacade";
import InsightFacade from "../../src/controller/InsightFacade";

import {folderTest} from "@ubccpsc310/folder-test";
import {expect, use} from "chai";
import chaiAsPromised from "chai-as-promised";
import {clearDisk, getContentFromArchives, getContentFromArchivesBinary} from "../TestUtil";
import {it} from "mocha";

use(chaiAsPromised);

describe("InsightFacade", function () {
	let facade: IInsightFacade;

	// Declare datasets used in tests. You should add more datasets like this!
	let sections: string;

	before(function () {
		// This block runs once and loads the datasets.
		sections = getContentFromArchives("pair.zip");

		// Just in case there is anything hanging around from a previous run of the test suite
		clearDisk();
	});

	describe("Add/Remove/List Dataset", function () {
		before(function () {
			console.info(`Before: ${this.test?.parent?.title}`);
		});

		beforeEach(function () {
			// This section resets the insightFacade instance
			// This runs before each test
			console.info(`BeforeTest: ${this.currentTest?.title}`);
			facade = new InsightFacade();
		});

		after(function () {
			console.info(`After: ${this.test?.parent?.title}`);
		});

		afterEach(function () {
			// This section resets the data directory (removing any cached data)
			// This runs after each test, which should make each test independent of the previous one
			console.info(`AfterTest: ${this.currentTest?.title}`);
			clearDisk();
		});

		// This is a unit test. You should create more like this!
		it("should reject with  an empty dataset id", function () {
			const result = facade.addDataset("", sections, InsightDatasetKind.Sections);
			return expect(result).to.eventually.be.rejectedWith(InsightError);
		});

		it("should reject with a string with only whitespace id", function (){
			const result = facade.addDataset(" ", sections, InsightDatasetKind.Sections);
			return expect(result).to.eventually.be.rejectedWith(InsightError);
		});

		it("should reject with a string with underscore id", function (){
			const result = facade.addDataset("id_1", sections, InsightDatasetKind.Sections);
			return expect(result).to.eventually.be.rejectedWith(InsightError);
		});

		it("should successfully add dataset (first)", function () {
			const result = facade.addDataset("ubc", sections, InsightDatasetKind.Sections);
			return expect(result).to.eventually.have.members(["ubc"]);
		});

		it("should successfully add dataset (second)", function () {
			const result = facade.addDataset("ubc", sections, InsightDatasetKind.Sections);
			return expect(result).to.eventually.have.members(["ubc"]);
		});

		it("should successfully add dataset with one character", function () {
			const result = facade.addDataset("1", sections, InsightDatasetKind.Sections);
			return expect(result).to.eventually.have.members(["1"]);
		});

		it("should successfully add dataset with special character but not underscore", function () {
			const result = facade.addDataset("ubc-sections", sections, InsightDatasetKind.Sections);
			return expect(result).to.eventually.have.members(["ubc-sections"]);
		});

		it("should successfully add multiple datasets with different id and show in array",
			async function () {
				const result1 = facade.addDataset("1", sections, InsightDatasetKind.Sections);
				await expect(result1).to.eventually.have.members(["1"]);
				const result2 = facade.addDataset("2", sections, InsightDatasetKind.Sections);
				return expect(result2).to.eventually.have.members(["1","2"]);
			});

		it("should handle crash when adding datasets",
			async function () {
				const result1 = facade.addDataset("1", sections, InsightDatasetKind.Sections);
				await expect(result1).to.eventually.have.members(["1"]);

				const facade2 = new InsightFacade();

				const result2 = facade2.addDataset("2", sections, InsightDatasetKind.Sections);
				return expect(result2).to.eventually.have.members(["1","2"]);
			});
		it("should reject because dataset with the same ID already exists",
			async function () {
				const result1 = facade.addDataset("ubc", sections, InsightDatasetKind.Sections);
				await expect(result1).to.eventually.have.members(["ubc"]);
				const result2 = facade.addDataset("ubc", sections, InsightDatasetKind.Sections);
				return expect(result2).to.eventually.be.rejectedWith(InsightError);
			});
		it("should reject if the dataset is not base64 encoded", function (){
			sections = getContentFromArchivesBinary("small.zip"); // change sections to binary based content
			const result = facade.addDataset("1", sections, InsightDatasetKind.Sections);
			return expect(result).to.eventually.be.rejectedWith(InsightError);
		});
		it("should reject if the dataset is invalid content (simple string)", function (){
			sections = "invalid content";
			const result = facade.addDataset("ubc", sections, InsightDatasetKind.Sections);
			return expect(result).to.eventually.be.rejectedWith(InsightError);
		});

		it("should reject if the dataset is invalid file type (txt)", function (){
			sections = getContentFromArchives("invalidFile.zip");
			const result = facade.addDataset("ubc", sections, InsightDatasetKind.Sections);
			return expect(result).to.eventually.be.rejectedWith(InsightError);
		});
		it("should reject if the dataset has no valid section(empty result)", function (){
			sections = getContentFromArchives("emptyResult.zip");
			const result = facade.addDataset("ubc", sections, InsightDatasetKind.Sections);
			return expect(result).to.eventually.be.rejectedWith(InsightError);
		});

		it("should reject if the dataset is NOT located within a folder called courses", function (){
			sections = getContentFromArchives("notCourses.zip");
			const result = facade.addDataset("ubc", sections, InsightDatasetKind.Sections);
			return expect(result).to.eventually.be.rejectedWith(InsightError);
		});

		it("should reject because of invalid dataset kind (rooms)", function () {
			const result = facade.addDataset("ubc", sections, InsightDatasetKind.Rooms);
			return expect(result).to.eventually.be.rejectedWith(InsightError);
		});
		// tests for removeDataset
		it("should reject when attempting to remove a non-existing dataset", function () {
			const nonExistingId = "nonExistingDataset";
			const result = facade.removeDataset(nonExistingId);
			return expect(result).to.eventually.be.rejectedWith(NotFoundError);
		});

		it("should reject when attempting to remove a invalid id (emptyString)", function () {
			const invalidID = "";
			const result = facade.removeDataset(invalidID);
			return expect(result).to.eventually.be.rejectedWith(InsightError);
		});

		it("should reject when attempting to remove a invalid id (whitespace)", function () {
			const invalidID = " ";
			const result = facade.removeDataset(invalidID);
			return expect(result).to.eventually.be.rejectedWith(InsightError);
		});

		it("should reject when attempting to remove a invalid id (underscore)", function () {
			const invalidID = "a_b";
			const result = facade.removeDataset(invalidID);
			return expect(result).to.eventually.be.rejectedWith(InsightError);
		});

		it("should successfully remove existing dataset", async function() {
			await facade.addDataset("ubc", sections, InsightDatasetKind.Sections);
			const result = facade.removeDataset("ubc");
			return expect(result).to.eventually.be.equal("ubc");
		});


		it("should handle crash before removing", async function() {
			await facade.addDataset("ubc", sections, InsightDatasetKind.Sections);

			const facade2 = new InsightFacade();
			const result = facade2.removeDataset("ubc");
			return expect(result).to.eventually.be.equal("ubc");
		});
		it("should list an empty facade with no dataset added", function () {
			const result = facade.listDatasets();
			return expect(result).to.eventually.be.deep.equal([]);
		});
		// tests for listDatasets
		it("should correctly list the full dataset when pair.zip is added",
			async function () {
				// sections = getContentFromArchives("pair.zip");
				await facade.addDataset("ubc", sections, InsightDatasetKind.Sections);

				const result = await facade.listDatasets();
				return expect(result).to.be.deep.equal([
					{
						id: "ubc",
						kind: InsightDatasetKind.Sections,
						numRows: 64612
					}
				]);
			});

		it("should handle crash before listing datasets",
			async function () {
				// sections = getContentFromArchives("pair.zip");
				await facade.addDataset("ubc", sections, InsightDatasetKind.Sections);

				// if facade crashed

				const facade2 = new InsightFacade();

				const result = await facade2.listDatasets();
				return expect(result).to.be.deep.equal([
					{
						id: "ubc",
						kind: InsightDatasetKind.Sections,
						numRows: 64612
					}
				]);
			});
		it("should correctly list the full datasets when more than one datasets are added",
			async function () {
				let sections1: string;
				// let sections2: string;
				sections1 = getContentFromArchives("pair.zip");
				// sections2 = getContentFromArchives("pair.zip");
				await facade.addDataset("ubc1", sections, InsightDatasetKind.Sections);
				await facade.addDataset("ubc2", sections1, InsightDatasetKind.Sections);

				const result = facade.listDatasets();
				return expect(result).to.eventually.be.deep.equal([
					{
						id: "ubc1",
						kind: InsightDatasetKind.Sections,
						numRows: 64612
					},
					{
						id: "ubc2",
						kind: InsightDatasetKind.Sections,
						numRows: 64612
					}
				]);
			});
	});

	/*
	 * This test suite dynamically generates tests from the JSON files in test/resources/queries.
	 * You should not need to modify it; instead, add additional files to the queries directory.
	 * You can still make tests the normal way, this is just a convenient tool for a majority of queries.
	 */
	describe("PerformQuery", () => {
		before(function () {
			console.info(`Before: ${this.test?.parent?.title}`);

			facade = new InsightFacade();

			// Load the datasets specified in datasetsToQuery and add them to InsightFacade.
			// Will *fail* if there is a problem reading ANY dataset.
			const loadDatasetPromises = [facade.addDataset(
				"sections", sections, InsightDatasetKind.Sections
			)];

			return Promise.all(loadDatasetPromises);
		});

		after(function () {
			console.info(`After: ${this.test?.parent?.title}`);
			clearDisk();
		});

		type PQErrorKind = "ResultTooLargeError" | "InsightError";

		folderTest<unknown, Promise<InsightResult[]>, PQErrorKind>(
			"Dynamic InsightFacade PerformQuery tests",
			(input) => facade.performQuery(input),
			"./test/resources/queries",
			{
				// assertOnResult: (actual, expected) => {
				// 	// TODO add an assertion!
				// 	expect(actual).to.eventually.have.deep.members(expected);
				// },

				assertOnResult: async (actual, expected) => {
					// TODO add an assertion!
					expect(actual).to.eventually.have.deep.members(await expected);
				},
				errorValidator: (error): error is PQErrorKind =>
					error === "ResultTooLargeError" || error === "InsightError",
				assertOnError: (actual, expected) => {
					// TODO add an assertion!
					if (expected === "InsightError") {
						expect(actual).to.be.instanceof(InsightError);
					} else if (expected === "ResultTooLargeError") {
						expect(actual).to.be.instanceof(ResultTooLargeError);
					} else {
						expect.fail("UNEXPECTED ERROR");
					}
				},
			}
		);
	});
});
