import {InsightDatasetKind, InsightError, InsightResult, ResultTooLargeError} from "../controller/IInsightFacade";
import {Dataset} from "./Dataset";
import Section from "./Section";
import {InsightKind} from "./InsightKind";
import {combineUnique, findIntersection, getDifference} from "./QueryEngineHelpers";

export class QueryEngine {
	private insightResults: InsightResult[] = [];
	private numOfSections: number = 0;
	private sectionsOrRooms: InsightKind[] = [];
	public queryDataset(dataset: Dataset, query: any): Promise<InsightResult[]> {
		if (dataset.kind !== InsightDatasetKind.Sections) {
			throw new InsightError("wrong dataset kind for query");
		}
		this.numOfSections = dataset.insightKindArray.length;
		this.sectionsOrRooms = dataset.insightKindArray;
		if (Object.keys(query["WHERE"]).length === 0 && !("TRANSFORMATIONS" in query)) {
			if (this.numOfSections > 5000) {
				return Promise.reject(new ResultTooLargeError("result too big"));
			}
		}
		this.insightResults = [];
		const filteredSections = this.filterWhere(this.sectionsOrRooms, query["WHERE"]);
		if (filteredSections.length > 5000) {
			return Promise.reject(new ResultTooLargeError("exceed 5000 results"));
		}
		this.handleOptions(filteredSections, query["OPTIONS"]);
		return Promise.resolve(this.insightResults);
	}

	/**
	 * Apply filters and return only the filtered sections.
	 * @param {Section[]} allSections - the array of all sections in the dataset to query.
	 * @param where - the body object in the query
	 * @returns {Section[]} an array of sections filtered by the filters in WHERE.
	 */
	private filterWhere(allSections: InsightKind[], where: any): InsightKind[] {
		if ("AND" in where) {
			return this.filterAnd(allSections, where["AND"]);
		}
		if ("OR" in where) {
			return this.filterOR(allSections, where["OR"]);
		}
		if ("IS" in where) {
			return this.filterIs(allSections, where["IS"]);
		}
		if ("NOT" in where) {
			return this.filterNot(allSections, where["NOT"]);
		}
		if ("GT" in where) {
			return this.filterGT(allSections, where["GT"]);
		}
		if ("LT" in where) {
			return this.filterLT(allSections, where["LT"]);
		}
		if ("EQ" in where) {
			return this.filterEQ(allSections, where["EQ"]);
		}
		return allSections;
	}

	private filterAnd(allSections: InsightKind[], andOp: []): InsightKind[] {
		// initiate an empty result array
		let andFilteredSections: InsightKind[] = [];
		for (let item of andOp) {
			let filteredArray = this.filterWhere(allSections, item);
			if (filteredArray.length === 0) {
				let emptyS: Section[] = [];
				return emptyS;
			}
			if (andFilteredSections.length === 0) {
				andFilteredSections = filteredArray;
			} else {
				andFilteredSections = findIntersection(andFilteredSections, filteredArray);
			}
		}
		return andFilteredSections;
	}

	private filterOR(allSections: InsightKind[], orOp: []): InsightKind[] {
		let orFilteredSections: InsightKind[] = [];
		for (let item of orOp) {
			let filteredArray = this.filterWhere(allSections, item);
			orFilteredSections = combineUnique(orFilteredSections, filteredArray);
		}
		return orFilteredSections;
	}

	private filterIs(allSections: InsightKind[], isOp: any): InsightKind[] {
		let isFilteredSections: InsightKind[] = [];
		const sKey: string = Object.keys(isOp)[0];
		const sField: string = sKey.split("_")[1];
		const inputString = Object.values(isOp)[0] as string;
		for (const section of allSections) {
			if (this.passSComparison(sField, inputString, section)) {
				isFilteredSections.push(section);
			}
		}
		return isFilteredSections;
	}

	private passSComparison(sField: string, inputString: string, section: InsightKind) {
		const fieldValue = section[sField];
		if (fieldValue === null || undefined) {
			return false;
		}
		if (!inputString.includes("*")) {
			return fieldValue === inputString;
		}
		if (inputString === "*") {
			return true;
		}
		if (inputString.startsWith("*") && !inputString.endsWith("*")) {
			return fieldValue.endsWith(inputString.substring(1, inputString.length));
		}
		if (!inputString.startsWith("*") && inputString.endsWith("*")) {
			return fieldValue.startsWith(inputString.substring(0, inputString.length - 1));
		}
		if (inputString.startsWith("*") && inputString.endsWith("*")) {
			return fieldValue.includes(inputString.substring(1, inputString.length - 1));
		}
		return false;
	}

	private filterNot(allSections: InsightKind[], notOp: any): InsightKind[] {
		let notFilteredSections: InsightKind[] = [];
		notFilteredSections = this.filterWhere(allSections, notOp);
		notFilteredSections = getDifference(allSections, notFilteredSections);
		return notFilteredSections;
	}

	private filterGT(allSections: InsightKind[], gtOp: any): InsightKind[] {
		let gtFilteredSections: InsightKind[] = [];
		const mKey: string = Object.keys(gtOp)[0];
		const mField: string = mKey.split("_")[1];
		const numValue = Object.values(gtOp)[0] as number;
		for (let section of allSections) {
			if (section[mField] > numValue) {
				gtFilteredSections.push(section);
			}
		}
		return gtFilteredSections;
	}

	private filterEQ(allSections: InsightKind[], eqOp: any): InsightKind[] {
		let eqFilteredSections: InsightKind[] = [];
		const mKey: string = Object.keys(eqOp)[0];
		const mField: string = mKey.split("_")[1];
		const numValue = Object.values(eqOp)[0] as number;
		for (let section of allSections) {
			if (section[mField] === numValue) {
				eqFilteredSections.push(section);
			}
		}
		return eqFilteredSections;
	}

	private filterLT(allSections: InsightKind[], ltOp: any): InsightKind[] {
		let ltFilteredSections: InsightKind[] = [];
		const mKey: string = Object.keys(ltOp)[0];
		const mField: string = mKey.split("_")[1];
		const numValue = Object.values(ltOp)[0] as number;
		for (let section of allSections) {
			if (section[mField] < numValue) {
				ltFilteredSections.push(section);
			}
		}
		return ltFilteredSections;
	}

	/**
	 * Puts InsightResult into the global field insightResults in the correct order.
	 * @param {Section[]} filteredSections - an array of sections that are filtered by the WHERE conditions.
	 * @param {object} options - the options object in the query.
	 */
	private handleOptions(filteredSections: InsightKind[], options: object) {
		if ("COLUMNS" in options) {
			this.handleColumns(options["COLUMNS"], filteredSections);
		}
		if ("ORDER" in options) {
			this.handleORDER(options["ORDER"]);
		}
	}

	private handleColumns(columns: any, filteredSections: InsightKind[]) {
		const stringColumns = columns as string[];
		for (let section of filteredSections) {
			let insightResultNew: InsightResult = {};
			for (let key of stringColumns) {
				let fieldName = key.split("_")[1];
				let fieldValue = section[fieldName];
				if (fieldName === "uuid") {
					insightResultNew[key] = fieldValue.toString();
				} else {
					insightResultNew[key] = fieldValue;
				}
			}
			this.insightResults.push(insightResultNew);
		}
	}

	private handleORDER(order: any) {
		const orderString = order as string;
		this.insightResults.sort((a: any, b: any) => a[orderString] - b[orderString]);
		return;
	}
}
