import {
	IInsightFacade,
	InsightDatasetKind,
	InsightError,
	InsightResult,
	NotFoundError,
	ResultTooLargeError,
} from "../../src/controller/IInsightFacade";
import InsightFacade from "../../src/controller/InsightFacade";

import {folderTest} from "@ubccpsc310/folder-test";
import {expect, use} from "chai";
import chaiAsPromised from "chai-as-promised";
import {clearDisk, getContentFromArchives, getContentFromArchivesBinary} from "../TestUtil";
import {it} from "mocha";
import {Dataset} from "../../src/models/Dataset";

use(chaiAsPromised);

describe("InsightFacade", function () {
	let facade: IInsightFacade;

	// Declare datasets used in tests. You should add more datasets like this!
	let sections: string;
	let sections2: string;
	let sectionsSmall: string;

	let rooms: string;
	let roomsSmall: string;
	let rooms2: string;

	before(function () {
		// This block runs once and loads the datasets.
		sections = getContentFromArchives("pair.zip");
		sectionsSmall = getContentFromArchives("small.zip");

		rooms = getContentFromArchives("campus.zip");
		roomsSmall = getContentFromArchives("campusSmall.zip");

		// Just in case there is anything hanging around from a previous run of the test suite
		clearDisk();
	});

	describe("Add/Remove/List RoomDataset", function () {
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
		it("should reject with an empty room dataset id", function () {
			const result = facade.addDataset("", roomsSmall, InsightDatasetKind.Rooms);
			return expect(result).to.eventually.be.rejectedWith(InsightError);
		});

		it("should reject adding a room dataset with a string with only whitespace id", function () {
			const result = facade.addDataset(" ", roomsSmall, InsightDatasetKind.Rooms);
			return expect(result).to.eventually.be.rejectedWith(InsightError);
		});

		it("should reject adding a room dataset with a string with underscore id", function () {
			const result = facade.addDataset("id_1", roomsSmall, InsightDatasetKind.Rooms);
			return expect(result).to.eventually.be.rejectedWith(InsightError);
		});

		it("should successfully add room dataset (first)", function () {
			const result = facade.addDataset("ubcRooms", roomsSmall, InsightDatasetKind.Rooms);
			return expect(result).to.eventually.have.members(["ubcRooms"]);
		});

		it("should successfully add room dataset (second)", function () {
			const result = facade.addDataset("ubcRooms2", roomsSmall, InsightDatasetKind.Rooms);
			return expect(result).to.eventually.have.members(["ubcRooms2"]);
		});

		it("should successfully add room dataset with one character", function () {
			const result = facade.addDataset("1", roomsSmall, InsightDatasetKind.Rooms);
			return expect(result).to.eventually.have.members(["1"]);
		});

		it("should successfully add room dataset with special character but not underscore", function () {
			const result = facade.addDataset("ubc-rooms", roomsSmall, InsightDatasetKind.Rooms);
			return expect(result).to.eventually.have.members(["ubc-rooms"]);
		});

		it("should successfully add multiple room datasets with different id and show in array", async function () {
			const result1 = await facade.addDataset("1", roomsSmall, InsightDatasetKind.Rooms);
			expect(result1).to.have.members(["1"]);
			// console.log(result1);
			// console.log(facade.listDatasets());

			const result2 = await facade.addDataset("2", roomsSmall, InsightDatasetKind.Rooms);
			// console.log(result2);

			// console.log(result2);
			// console.log(await facade2.listDatasets());
			const datasetsAfterCrash = await facade.listDatasets();

			// console.log(facade2.listDatasets());
			// !!! might not be the correct way to assert, issue with crash handling
			// const appendResultId = [...result1, ...result2];
			return expect(datasetsAfterCrash).to.have.deep.members([
				{id: "1", kind: "rooms", numRows: 16},
				{id: "2", kind: "rooms", numRows: 16},
			]);
		});

		it("should handle crash when adding room datasets", async function () {
			const result1 = await facade.addDataset("1", roomsSmall, InsightDatasetKind.Rooms);
			expect(result1).to.have.members(["1"]);
			// console.log(result1);

			const facade2 = new InsightFacade();
			const result2 = await facade2.addDataset("2", roomsSmall, InsightDatasetKind.Rooms);
			expect(result2).to.have.members(["1", "2"]);

			// console.log(result2);
			// console.log(await facade2.listDatasets());
			const datasetsAfterCrash = await facade2.listDatasets();

			// console.log(facade2.listDatasets());
			// !!! might not be the correct way to assert, issue with crash handling
			// const appendResultId = [...result1, ...result2];
			return expect(datasetsAfterCrash).to.have.deep.members([
				{id: "1", kind: "rooms", numRows: 16},
				{id: "2", kind: "rooms", numRows: 16},
			]);
		});

		it("should reject because room dataset with the same ID already exists", async function () {
			const result1 = facade.addDataset("ubc", roomsSmall, InsightDatasetKind.Rooms);
			await expect(result1).to.eventually.have.members(["ubc"]);
			const result2 = facade.addDataset("ubc", rooms, InsightDatasetKind.Rooms);
			return expect(result2).to.eventually.be.rejectedWith(InsightError);
		});

		it("should reject if the room dataset is not base64 encoded", function () {
			rooms2 = getContentFromArchivesBinary("campusSmall.zip"); // change sections to binary based content
			const result = facade.addDataset("1", rooms2, InsightDatasetKind.Rooms);
			return expect(result).to.eventually.be.rejectedWith(InsightError);
		});

		it("should reject if the room dataset is not a zip file", function () {
			rooms2 = getContentFromArchives("blank.ts");
			const result = facade.addDataset("ubc", rooms2, InsightDatasetKind.Rooms);
			return expect(result).to.eventually.be.rejectedWith(InsightError);
		});

		it("should reject if the room dataset is invalid file type (txt)", function () {
			rooms2 = getContentFromArchives("invalidFile.zip");
			const result = facade.addDataset("ubc", rooms2, InsightDatasetKind.Rooms);
			return expect(result).to.eventually.be.rejectedWith(InsightError);
		});

		it("should reject adding a room dataset with a zip file thats only the root file, index.htm", function () {
			rooms2 = getContentFromArchives("campusOnlyIndex.zip");
			const result = facade.addDataset("ubc", rooms2, InsightDatasetKind.Rooms);
			return expect(result).to.eventually.be.rejectedWith(InsightError);
		});

		it("should reject if the room dataset if only campus folder, no root", function () {
			rooms2 = getContentFromArchives("campusOnlyCampus.zip");
			const result = facade.addDataset("ubc", rooms2, InsightDatasetKind.Rooms);
			return expect(result).to.eventually.be.rejectedWith(InsightError);
		});

		it("should reject if the room dataset is missing discover folder", function () {
			rooms2 = getContentFromArchives("campusNoDiscover.zip");
			const result = facade.addDataset("ubc", rooms2, InsightDatasetKind.Rooms);
			return expect(result).to.eventually.be.rejectedWith(InsightError);
		});

		it("should reject if the room dataset is missing buildings-and-classrooms folder", function () {
			rooms2 = getContentFromArchives("campusNoBuildingsAndClassroom.zip");
			const result = facade.addDataset("ubc", rooms2, InsightDatasetKind.Rooms);
			return expect(result).to.eventually.be.rejectedWith(InsightError);
		});

		it("should reject if the room dataset has empty BuildingsAndClassrooms (no valid room)", function () {
			rooms2 = getContentFromArchives("campusEmptyBuildingsAndClassrooms.zip");
			const result = facade.addDataset("ubc", sections2, InsightDatasetKind.Rooms);
			return expect(result).to.eventually.be.rejectedWith(InsightError);
		});

		it("should reject if the room dataset has valid Building but no valid rooms", function () {
			rooms2 = getContentFromArchives("campusValidBuildingNoValidRooms.zip");
			const result = facade.addDataset("ubc", sections2, InsightDatasetKind.Rooms);
			return expect(result).to.eventually.be.rejectedWith(InsightError);
		});

		it("should reject if the room dataset has no valid htm formatted file (JSON)", function () {
			rooms2 = getContentFromArchives("campusNoHtmFile.zip");
			const result = facade.addDataset("ubc", sections2, InsightDatasetKind.Rooms);
			return expect(result).to.eventually.be.rejectedWith(InsightError);
		});

		it("should reject if the room dataset has no table in index", function () {
			rooms2 = getContentFromArchives("campusNoTableInIndex.zip");
			const result = facade.addDataset("ubc", sections2, InsightDatasetKind.Rooms);
			return expect(result).to.eventually.be.rejectedWith(InsightError);
		});

		it("should reject if the room dataset has building href is not linked through index", function () {
			rooms2 = getContentFromArchives("campusBuildingLinkNotThroughCampus.zip");
			const result = facade.addDataset("ubc", sections2, InsightDatasetKind.Rooms);
			return expect(result).to.eventually.be.rejectedWith(InsightError);
		});

		it("should reject if the room dataset has missing building code class in index", function () {
			rooms2 = getContentFromArchives("campusIndexMissingBuildingCodeClass.zip");
			const result = facade.addDataset("ubc", sections2, InsightDatasetKind.Rooms);
			return expect(result).to.eventually.be.rejectedWith(InsightError);
		});

		it("should reject if the room dataset has missing class room number in building", function () {
			rooms2 = getContentFromArchives("campusBuildingMissingRoomNumClass.zip");
			const result = facade.addDataset("ubc", sections2, InsightDatasetKind.Rooms);
			return expect(result).to.eventually.be.rejectedWith(InsightError);
		});

		it("should successfully add room dataset with non-intuitive values in building field capacity", function () {
			rooms2 = getContentFromArchives("campusBuildingCapacityNotIntuitive.zip");
			const result = facade.addDataset("ubcRooms", rooms2, InsightDatasetKind.Rooms);
			return expect(result).to.eventually.have.members(["ubcRooms"]);
		});

		it("should successfully add room dataset with empty string values in building field room type", function () {
			rooms2 = getContentFromArchives("campusBuildingRoomTypeEmptyString.zip");
			const result = facade.addDataset("ubcRooms", rooms2, InsightDatasetKind.Rooms);
			return expect(result).to.eventually.have.members(["ubcRooms"]);
		});

		it("should successfully add room large dataset", function () {
			const result = facade.addDataset("ubcRooms", rooms, InsightDatasetKind.Rooms);
			return expect(result).to.eventually.have.members(["ubcRooms"]);
		});

		// tests for removeDataset
		it("should reject when attempting to remove a non-existing room dataset", function () {
			const nonExistingId = "nonExistingDataset";
			const result = facade.removeDataset(nonExistingId);
			return expect(result).to.eventually.be.rejectedWith(NotFoundError);
		});

		it("should reject when attempting to remove room dataset with an invalid id (emptyString)", async function () {
			const invalidID = "";
			await facade.addDataset("ubc", roomsSmall, InsightDatasetKind.Rooms);
			try {
				await facade.removeDataset(invalidID);
				throw new Error("Expected removeDataset to fail");
			} catch (error) {
				expect(error).to.be.instanceOf(InsightError);
			}
			// const result = facade.removeDataset(invalidID);
			// return expect(result).to.eventually.be.rejectedWith(InsightError);
		});

		it("should reject when attempting to remove a room dataset with an invalid id (whitespace)", async function () {
			const invalidID = " ";
			await facade.addDataset("ubc", roomsSmall, InsightDatasetKind.Rooms);
			const result = facade.removeDataset(invalidID);
			return expect(result).to.eventually.be.rejectedWith(InsightError);
		});

		it("should reject when attempting to remove a room dataset with an invalid id (underscore)", async function () {
			const invalidID = "a_b";
			await facade.addDataset("ubc", roomsSmall, InsightDatasetKind.Rooms);
			const result = facade.removeDataset(invalidID);
			return expect(result).to.eventually.be.rejectedWith(InsightError);
		});

		it("should successfully remove existing room dataset", async function () {
			await facade.addDataset("ubc", roomsSmall, InsightDatasetKind.Rooms);
			const result = facade.removeDataset("ubc");
			return expect(result).to.eventually.be.equal("ubc");
		});
		// !!! sections2 not initiated?
		it("should successfully remove a room dataset out of datasets", function () {
			const result = facade
				.addDataset("ubc", roomsSmall, InsightDatasetKind.Rooms)
				.then(() => facade.addDataset("smallubc", roomsSmall, InsightDatasetKind.Rooms))
				.then(() => facade.removeDataset("ubc"));
			return expect(result).to.eventually.equal("ubc");
		});

		it("should handle crash before removing room dataset", async function () {
			const result1 = await facade.addDataset("ubc", roomsSmall, InsightDatasetKind.Rooms);

			const facade2 = new InsightFacade();
			const result2 = facade2.removeDataset("ubc");
			// console.log(result2);
			return expect(result2).to.eventually.be.equal("ubc");
		});

		// tests for listDatasets
		it("should list an empty facade with no room dataset added", function () {
			const result = facade.listDatasets();
			return expect(result).to.eventually.be.deep.equal([]);
		});

		it("should correctly list the full room dataset when rooms.zip is added", async function () {
			// sections = getContentFromArchives("pair.zip");
			const result1 = await facade.addDataset("ubc", rooms, InsightDatasetKind.Rooms);
			// console.log("successfully added ubc dataset");
			// console.log(result1);

			const result2 = await facade.listDatasets();
			// console.log(result2);

			return expect(result2).to.be.deep.equal([
				{
					id: "ubc",
					kind: InsightDatasetKind.Rooms,
					numRows: 364,
				},
			]);
		});

		it("should handle crash before listing room datasets", async function () {
			// sections = getContentFromArchives("pair.zip");
			await facade.addDataset("ubc", rooms, InsightDatasetKind.Rooms);

			// if facade crashed

			const facade2 = new InsightFacade();

			const result = await facade2.listDatasets();

			return expect(result).to.be.deep.equal([
				{
					id: "ubc",
					kind: InsightDatasetKind.Rooms,
					numRows: 364,
				},
			]);
		});

		it("should correctly list the full room datasets when more than one datasets are added", async function () {
			// let sections1: string;
			// let sections2: string;
			sections2 = getContentFromArchives("pair.zip");
			// sections2 = getContentFromArchives("pair.zip");
			await facade.addDataset("ubc1", rooms, InsightDatasetKind.Rooms);
			await facade.addDataset("ubc2", roomsSmall, InsightDatasetKind.Rooms);

			const result = facade.listDatasets();
			return expect(result).to.eventually.be.deep.equal([
				{
					id: "ubc1",
					kind: InsightDatasetKind.Rooms,
					numRows: 364,
				},
				{
					id: "ubc2",
					kind: InsightDatasetKind.Rooms,
					numRows: 16,
				},
			]);
		});
	});

	describe("Add/Remove/List SectionDataset", function () {
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
		it("should reject adding section dataset with an empty dataset id", function () {
			const result = facade.addDataset("", sectionsSmall, InsightDatasetKind.Sections);
			// add a breakpoint here
			// get the data in a zip format
			// add a breakpoint here
			// parsing the zip
			return expect(result).to.eventually.be.rejectedWith(InsightError);
		});

		it("should reject adding section dataset with a string with only whitespace id", function () {
			const result = facade.addDataset(" ", sectionsSmall, InsightDatasetKind.Sections);
			return expect(result).to.eventually.be.rejectedWith(InsightError);
		});

		it("should reject adding section dataset with a string with underscore id", function () {
			const result = facade.addDataset("id_1", sections, InsightDatasetKind.Sections);
			return expect(result).to.eventually.be.rejectedWith(InsightError);
		});

		it("should successfully add section dataset (first)", function () {
			const result = facade.addDataset("ubc", sectionsSmall, InsightDatasetKind.Sections);
			return expect(result).to.eventually.have.members(["ubc"]);
		});

		it("should successfully add section dataset (second)", function () {
			const result = facade.addDataset("ubc", sectionsSmall, InsightDatasetKind.Sections);
			return expect(result).to.eventually.have.members(["ubc"]);
		});

		it("should successfully add section dataset with one character", function () {
			const result = facade.addDataset("1", sectionsSmall, InsightDatasetKind.Sections);
			return expect(result).to.eventually.have.members(["1"]);
		});

		it("should successfully add section dataset with special character but not underscore", function () {
			const result = facade.addDataset("ubc-sections", sectionsSmall, InsightDatasetKind.Sections);
			return expect(result).to.eventually.have.members(["ubc-sections"]);
		});

		it("should successfully add multiple section datasets with different id and show in array", async function () {
			const result1 = await facade.addDataset("1", sectionsSmall, InsightDatasetKind.Sections);
			expect(result1).to.have.members(["1"]);
			// console.log(result1);
			// console.log(facade.listDatasets());

			const result2 = await facade.addDataset("2", sectionsSmall, InsightDatasetKind.Sections);
			// console.log(result2);

			// console.log(result2);
			// console.log(await facade2.listDatasets());
			const datasetsAfterCrash = await facade.listDatasets();

			// console.log(facade2.listDatasets());
			// !!! might not be the correct way to assert, issue with crash handling
			// const appendResultId = [...result1, ...result2];
			return expect(datasetsAfterCrash).to.have.deep.members([
				{id: "1", kind: "sections", numRows: 58},
				{id: "2", kind: "sections", numRows: 58},
			]);
		});

		it("should handle crash when adding section datasets", async function () {
			const result1 = await facade.addDataset("1", sectionsSmall, InsightDatasetKind.Sections);
			expect(result1).to.have.members(["1"]);
			// console.log(result1);

			const facade2 = new InsightFacade();
			const result2 = await facade2.addDataset("2", sectionsSmall, InsightDatasetKind.Sections);
			expect(result2).to.have.members(["1", "2"]);

			// console.log(result2);
			// console.log(await facade2.listDatasets());
			const datasetsAfterCrash = await facade2.listDatasets();

			// console.log(facade2.listDatasets());
			// !!! might not be the correct way to assert, issue with crash handling
			// const appendResultId = [...result1, ...result2];
			return expect(datasetsAfterCrash).to.have.deep.members([
				{id: "1", kind: "sections", numRows: 58},
				{id: "2", kind: "sections", numRows: 58},
			]);
		});

		it("should reject adding section dataset because dataset with the same ID already exists", async function () {
			const result1 = facade.addDataset("ubc", sectionsSmall, InsightDatasetKind.Sections);
			await expect(result1).to.eventually.have.members(["ubc"]);
			const result2 = facade.addDataset("ubc", sections, InsightDatasetKind.Sections);
			return expect(result2).to.eventually.be.rejectedWith(InsightError);
		});

		it("should reject adding section dataset if the dataset is not base64 encoded", function () {
			sections2 = getContentFromArchivesBinary("small.zip"); // change sections to binary based content
			const result = facade.addDataset("1", sections2, InsightDatasetKind.Sections);
			return expect(result).to.eventually.be.rejectedWith(InsightError);
		});

		it("should reject adding section dataset if the dataset is invalid content (simple string)", function () {
			sections2 = "invalid content";
			const result = facade.addDataset("ubc", sections2, InsightDatasetKind.Sections);
			return expect(result).to.eventually.be.rejectedWith(InsightError);
		});

		it("should reject adding section dataset if the dataset is not a zip file", function () {
			sections2 = getContentFromArchives("blank.ts");
			const result = facade.addDataset("ubc", sections2, InsightDatasetKind.Sections);
			return expect(result).to.eventually.be.rejectedWith(InsightError);
		});

		it("should reject adding section dataset if the dataset is invalid file type (txt)", function () {
			sections2 = getContentFromArchives("invalidFile.zip");
			const result = facade.addDataset("ubc", sections2, InsightDatasetKind.Sections);
			return expect(result).to.eventually.be.rejectedWith(InsightError);
		});

		it("should reject with zip file of the course directly, " + "there is no course folder", function () {
			sections2 = getContentFromArchives("AANB500.zip");
			const result = facade.addDataset("ubc", sections2, InsightDatasetKind.Sections);
			return expect(result).to.eventually.be.rejectedWith(InsightError);
		});

		it("should reject if section dataset is not a JSON formatted file", function () {
			sections2 = getContentFromArchives("notJSONformat.zip");
			const result = facade.addDataset("ubc", sections2, InsightDatasetKind.Sections);
			return expect(result).to.eventually.be.rejectedWith(InsightError);
		});

		it("should reject if the section dataset has no valid section(empty result)", function () {
			sections2 = getContentFromArchives("emptyResult.zip");
			const result = facade.addDataset("ubc", sections2, InsightDatasetKind.Sections);
			return expect(result).to.eventually.be.rejectedWith(InsightError);
		});

		it("should reject with a course folder that has no valid sections from pair file", function () {
			sections2 = getContentFromArchives("emptyCourseFromPair.zip");
			const result = facade.addDataset("ubc", sections2, InsightDatasetKind.Sections);
			return expect(result).to.eventually.be.rejectedWith(InsightError);
		});

		it("should succesfully add dataset with one section having an empty string field", function () {
			sections2 = getContentFromArchives("hasvalidemptystringsection.zip");
			const result = facade.addDataset("ubc", sections2, InsightDatasetKind.Sections);
			return expect(result).to.eventually.have.members(["ubc"]);
		});

		it("should reject with a content that is missing a sfield, the id field", function () {
			sections2 = getContentFromArchives("missingSfieldID.zip");
			const result = facade.addDataset("ubc", sections2, InsightDatasetKind.Sections);
			return expect(result).to.eventually.be.rejectedWith(InsightError);
		});

		it("should reject with a content that is missing a mfield, the avg field", function () {
			sections2 = getContentFromArchives("missingMfieldAvg.zip");
			const result = facade.addDataset("ubc", sections2, InsightDatasetKind.Sections);
			return expect(result).to.eventually.be.rejectedWith(InsightError);
		});

		it("should reject if the dataset is NOT located within a folder called courses", function () {
			sections2 = getContentFromArchives("notCourses.zip");
			const result = facade.addDataset("ubc", sections2, InsightDatasetKind.Sections);
			return expect(result).to.eventually.be.rejectedWith(InsightError);
		});

		// it("should reject because of invalid dataset kind (rooms)", function () {
		// 	const result = facade.addDataset("ubc", sectionsSmall, InsightDatasetKind.Rooms);
		// 	return expect(result).to.eventually.be.rejectedWith(InsightError);
		// });

		// tests for removeDataset
		it("should reject when attempting to remove a non-existing section dataset", function () {
			const nonExistingId = "nonExistingDataset";
			const result = facade.removeDataset(nonExistingId);
			return expect(result).to.eventually.be.rejectedWith(NotFoundError);
		});

		it("should reject when attempting to remove a invalid id (emptyString) from section", async function () {
			const invalidID = "";
			await facade.addDataset("ubc", sectionsSmall, InsightDatasetKind.Sections);
			try {
				await facade.removeDataset(invalidID);
				throw new Error("Expected removeDataset to fail");
			} catch (error) {
				expect(error).to.be.instanceOf(InsightError);
			}
			// const result = facade.removeDataset(invalidID);
			// return expect(result).to.eventually.be.rejectedWith(InsightError);
		});

		it("should reject when attempting to remove a invalid id (whitespace) from section", async function () {
			const invalidID = " ";
			await facade.addDataset("ubc", sectionsSmall, InsightDatasetKind.Sections);
			const result = facade.removeDataset(invalidID);
			return expect(result).to.eventually.be.rejectedWith(InsightError);
		});

		it("should reject when attempting to remove a invalid id (underscore) from section", async function () {
			const invalidID = "a_b";
			await facade.addDataset("ubc", sectionsSmall, InsightDatasetKind.Sections);
			const result = facade.removeDataset(invalidID);
			return expect(result).to.eventually.be.rejectedWith(InsightError);
		});

		it("should successfully remove existing section dataset", async function () {
			await facade.addDataset("ubc", sectionsSmall, InsightDatasetKind.Sections);
			const result = facade.removeDataset("ubc");
			return expect(result).to.eventually.be.equal("ubc");
		});

		it("should successfully remove a section dataset out of datasets", function () {
			const result = facade
				.addDataset("ubc", sectionsSmall, InsightDatasetKind.Sections)
				.then(() => facade.addDataset("smallubc", sectionsSmall, InsightDatasetKind.Sections))
				.then(() => facade.removeDataset("ubc"));
			return expect(result).to.eventually.equal("ubc");
		});

		it("should handle crash before removing section dataset", async function () {
			const result1 = await facade.addDataset("ubc", sectionsSmall, InsightDatasetKind.Sections);

			const facade2 = new InsightFacade();
			const result2 = facade2.removeDataset("ubc");
			// console.log(result2);
			return expect(result2).to.eventually.be.equal("ubc");
		});

		it("should list an empty facade with no section dataset added", function () {
			const result = facade.listDatasets();
			return expect(result).to.eventually.be.deep.equal([]);
		});

		// tests for listDatasets
		it("should correctly list the full section dataset when pair.zip is added", async function () {
			// sections = getContentFromArchives("pair.zip");
			const result1 = await facade.addDataset("ubc", sections, InsightDatasetKind.Sections);
			// console.log("successfully added ubc dataset");
			// console.log(result1);

			const result2 = await facade.listDatasets();
			// console.log(result2);

			return expect(result2).to.be.deep.equal([
				{
					id: "ubc",
					kind: InsightDatasetKind.Sections,
					numRows: 64612,
				},
			]);
		});

		it("should handle crash before listing section datasets", async function () {
			// sections = getContentFromArchives("pair.zip");
			await facade.addDataset("ubc", sections, InsightDatasetKind.Sections);

			// if facade crashed

			const facade2 = new InsightFacade();

			const result = await facade2.listDatasets();

			return expect(result).to.be.deep.equal([
				{
					id: "ubc",
					kind: InsightDatasetKind.Sections,
					numRows: 64612,
				},
			]);
		});

		it("should correctly list the full section datasets when more than one are added", async function () {
			// let sections1: string;
			// let sections2: string;
			sections2 = getContentFromArchives("pair.zip");
			// sections2 = getContentFromArchives("pair.zip");
			await facade.addDataset("ubc1", sections, InsightDatasetKind.Sections);
			await facade.addDataset("ubc2", sections2, InsightDatasetKind.Sections);

			const result = facade.listDatasets();
			return expect(result).to.eventually.be.deep.equal([
				{
					id: "ubc1",
					kind: InsightDatasetKind.Sections,
					numRows: 64612,
				},
				{
					id: "ubc2",
					kind: InsightDatasetKind.Sections,
					numRows: 64612,
				},
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
			const loadDatasetPromises = [facade.addDataset("sections", sections, InsightDatasetKind.Sections)];

			return Promise.all(loadDatasetPromises);
		});

		after(function () {
			console.info(`After: ${this.test?.parent?.title}`);
			clearDisk();
		});
		// tested facade2 for handle-crash and passed
		let facade2 = new InsightFacade();
		type PQErrorKind = "ResultTooLargeError" | "InsightError";

		folderTest<unknown, Promise<InsightResult[]>, PQErrorKind>(
			"Dynamic InsightFacade PerformQuery tests",
			(input) => facade.performQuery(input),
			"./test/resources/andyC2queries",
			{
				// assertOnResult: (actual, expected) => {
				// 	// TODO add an assertion!
				// 	expect(actual).to.eventually.have.deep.members(expected);
				// },

				assertOnResult: async (actual, expected) => {
					// TODO add an assertion!
					expect(actual).to.have.deep.members(await expected);
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
