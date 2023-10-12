import {InsightDatasetKind, InsightError, InsightResult, ResultTooLargeError} from "../controller/IInsightFacade";
import {Dataset} from "./Dataset";
import Section from "./Section";


export class QueryEngine{
	// private idStringPattern: RegExp = /^[^_]+$/;
	// private inputStringPattern: RegExp = /^((\*)?[^*]*(\*)?)$/;
	// private mKeyPattern: RegExp = /^[^_]+_(avg|pass|fail|audit|year)$/;
	// private sKeyPattern: RegExp = new RegExp(/^[^_]+_(dept|id|instructor|title|uuid)$/);
	private insightResults: InsightResult [] = [];
	private numOfSections: number = 0;
	private sections: Section[] = [];
	public queryDataset (dataset: Dataset, query: any): Promise<InsightResult[]> {
		if (dataset.kind !== InsightDatasetKind.Sections) {
			throw new InsightError("wrong dataset kind for query");
		}
		this.numOfSections = dataset.sections.length;
		this.sections = dataset.sections;
		if ((Object.keys(query["WHERE"])).length === 0) {
			if (this.numOfSections > 5000) {
				return Promise.reject(new ResultTooLargeError("result too big"));
			}
		}
		this.insightResults = [];
		const filteredSections = this.filterWhere(this.sections, query["WHERE"]);
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
	private filterWhere (allSections: Section [], where: any): Section[] {
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
		// if none of these filters are in where, return all
		return allSections;
	}
	private filterAnd(allSections: Section[], andOp: []): Section[] {
		// initiate an empty result array
		let andFilteredSections: Section[] = [];
		// for each filter in and
		for (let item of andOp) {
			// filteredArray gets the result of the current filter
			let filteredArray = this.filterWhere(allSections, item);
			// if this is the first filter, let final result get its result
			if (andFilteredSections.length === 0) {
				// get the result of the first filter in and
				andFilteredSections = filteredArray;
			} else {
				// if not the first filter, find the intersection of the current result with subsequent result
				andFilteredSections = this.intersection(andFilteredSections,filteredArray);
			}
		}
		return andFilteredSections;
	}
	private intersection(arr1: Section[], arr2: Section[]) {
		return arr1.filter((item) => arr2.includes(item));
	}

	private filterOR(allSections: Section[], orOp: []): Section[] {
		// initiate result array
		let orFilteredSections: Section[] = [];
		// for each filter in or
		for (let item of orOp) {
			// get the result of the filter
			let filteredArray = this.filterWhere(allSections, item);
			// combine it with current result and only leave the unique ones
			orFilteredSections = this.combineUnique(orFilteredSections,filteredArray);
		}
		return orFilteredSections;
	}
	private combineUnique(arr1: Section[], arr2: Section[]) {
		const combinedSet = new Set([...arr1, ...arr2]);
		return Array.from(combinedSet);
	}

	private filterIs(allSections: Section[], isOp: any): Section[] {
		let isFilteredSections: Section[] = [];
		const sKey: string = Object.keys(isOp)[0];
		const sField: string = sKey.split("_")[1];
		const inputString = Object.values(isOp)[0] as string;
		for (const section of allSections) {
			if (this.passSComparison(sField,inputString, section)) {
				isFilteredSections.push(section);
			}
		}
		return isFilteredSections;
	}
	private passSComparison(sField: string, inputString: string, section: Section) {
		const fieldValue = section[sField];
		if (fieldValue === null || undefined) {
			return false;
		}
		if (!inputString.includes("*")) {
			return fieldValue === inputString;
		}
		if (inputString.startsWith("*") && !inputString.endsWith("*")) {
			return fieldValue.endsWith(inputString.substring(1,inputString.length));
		}
		if (!inputString.startsWith("*") && inputString.endsWith("*")) {
			return fieldValue.startsWith(inputString.substring(0,inputString.length - 1));
		}
		if (inputString.startsWith("*") && inputString.endsWith("*")) {
			return fieldValue.includes(inputString.substring(1,inputString.length - 1));
		}
		return false;
	}


	private filterNot(allSections: Section[], notOp: any): Section[] {
		let notFilteredSections: Section[] = [];
		notFilteredSections = this.filterWhere(allSections, notOp);
		notFilteredSections = this.getDifference(allSections, notFilteredSections);
		return notFilteredSections;
	}
	private getDifference(arr1: Section[], arr2: Section[]): any[] {
		return arr1.filter((item) => !arr2.includes(item));
	}

	private filterGT(allSections: Section[], gtOp: any): Section[] {
		let gtFilteredSections: Section[] = [];
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

	private filterEQ(allSections: Section[], eqOp: any): Section[] {
		let eqFilteredSections: Section[] = [];
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
	private filterLT(allSections: Section[], ltOp: any): Section[] {
		let ltFilteredSections: Section[] = [];
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
	private handleOptions (filteredSections: Section[], options: object){
		if ("COLUMNS" in options) {
			this.handleColumns(options["COLUMNS"], filteredSections);
		}
		if ("ORDER" in options) {
			this.handleORDER(options["ORDER"]);
		}
	}

	private handleColumns(columns: any, filteredSections: Section[]){
		const stringColumns = columns as string[];
		// for each section
		for(let section of filteredSections) {
			// make a new insightResult
			let insightResultNew: InsightResult = {};
			// for each key in columns
			for (let key of stringColumns) {
				// get the field name from key and value of that key from section
				let fieldName = key.split("_")[1];
				let fieldValue = section[fieldName];
				if (fieldName === "uuid") {
					insightResultNew[key] = fieldValue.toString();
				} else {
					// add the key value to insightResultNEW
					insightResultNew[key] = fieldValue;
				}
			}
			// after all key values are added in the for loop, push it into insightResults
			this.insightResults.push(insightResultNew);
		}
	}

	private handleORDER(order: any){
		const orderString = order as string;
		// Sorting based on the specified key in ascending order
		this.insightResults.sort((a: any, b: any) => a[orderString] - b[orderString]);
		return;
	}
}
