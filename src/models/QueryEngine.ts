import {InsightDatasetKind, InsightError, InsightResult, ResultTooLargeError} from "../controller/IInsightFacade";
import {Dataset} from "./Dataset";
import Section from "./Section";
import {InsightKind} from "./InsightKind";
import {
	combineUnique,
	findIntersection,
	getDifference,
	passSComparison,
	isString,
	calculateApply
} from "./QueryEngineHelpers";

export class QueryEngine {
	private insightResults: InsightResult[] = [];
	private numOfSectionsOrRooms: number = 0;
	private sectionsOrRooms: InsightKind[] = [];
	private columnsArray: string[] = [];
	private hasTrans = false;
	public queryDataset(dataset: Dataset, query: any): Promise<InsightResult[]> {
		// if (dataset.kind !== InsightDatasetKind.Sections) {
		// 	throw new InsightError("wrong dataset kind for query");
		// }
		this.numOfSectionsOrRooms = dataset.insightKindArray.length;
		this.sectionsOrRooms = dataset.insightKindArray;
		if (Object.keys(query["WHERE"]).length === 0 && !("TRANSFORMATIONS" in query)) {
			if (this.numOfSectionsOrRooms > 5000) {
				return Promise.reject(new ResultTooLargeError("result too big"));
			}
		}
		this.insightResults = [];
		this.columnsArray = query["OPTIONS"]["COLUMNS"];
		const filteredSectionsOrRooms = this.filterWhere(this.sectionsOrRooms, query["WHERE"]);
		if (filteredSectionsOrRooms.length > 5000  && !("TRANSFORMATIONS" in query)) {
			return Promise.reject(new ResultTooLargeError("exceed 5000 results"));
		}
		if ("TRANSFORMATIONS" in query) {
			this.hasTrans = true;
			this.handleTransformations(filteredSectionsOrRooms, query["TRANSFORMATIONS"]);
			if (this.insightResults.length > 5000) {
				return Promise.reject(new ResultTooLargeError("exceed 5000 results"));
			}
		}
		this.handleOptions(filteredSectionsOrRooms, query["OPTIONS"]);
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
				return [];
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
			if (passSComparison(sField, inputString, section)) {
				isFilteredSections.push(section);
			}
		}
		return isFilteredSections;
	}

	private filterNot(allSections: InsightKind[], notOp: any): InsightKind[] {
		let notFilteredSections: InsightKind[];
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

	private handleTransformations(filteredSectionsOrRooms: InsightKind[], transformations: any) {
		const groupedResults = this.groupResults(filteredSectionsOrRooms, transformations["GROUP"]);
		this.handleApply(groupedResults,transformations["APPLY"]);
	}

	private groupResults(filteredSectionsOrRooms: InsightKind[], group: any): Map<string, InsightKind[]> {
		const groupedMap = new Map<string, InsightKind[]>();
		for (const sectionOrRoom of filteredSectionsOrRooms) {
			// make a key for each section based on the group keys
			let mapKey = "";
			for(const groupKey of group) {
				const field: string = groupKey.split("_")[1];
				mapKey += sectionOrRoom[field];
			}
			if (groupedMap.has(mapKey)) {
				const arrayWithMapKey = groupedMap.get(mapKey) as InsightKind[];
				arrayWithMapKey.push(sectionOrRoom);
				groupedMap.set(mapKey, arrayWithMapKey);
			} else {
				groupedMap.set(mapKey,[sectionOrRoom]);
			}
		}
		return groupedMap;
	}

	private handleApply(groupedResults: Map<string, InsightKind[]>, apply: any) {
		for (const [key, value] of groupedResults.entries()) {
			let insightResultNew: InsightResult = {};
			for (let cKey of this.columnsArray) {
				if (cKey.includes("_")) {
					let fieldName = cKey.split("_")[1];
					let fieldValue = value[0][fieldName];
					if (fieldName === "uuid") {
						insightResultNew[cKey] = fieldValue.toString();
					} else {
						insightResultNew[cKey] = fieldValue;
					}
				} else {
					for (let item of apply) {
						if (Object.keys(item)[0] === cKey) {
							insightResultNew[cKey] = calculateApply(value, Object.values(item)[0]);
							break;
						}
					}
				}
			}
			this.insightResults.push(insightResultNew);
		}
	}

	private handleOptions(filteredSections: InsightKind[], options: object) {
		if ("COLUMNS" in options && !this.hasTrans) {
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
		if (isString(order)) {
			const orderString = order as string;
			this.insightResults.sort((a: any, b: any) => a[orderString] - b[orderString]);
			return;
		} else {
			let direction = order["dir"];
			let orderKeys = order["keys"];
			const dNum = direction === "UP" ? 1 : -1;
			for (const orderKey of orderKeys) {
				this.insightResults.sort((a,b): number => {
					if (a[orderKey] > b[orderKey]){
						return dNum;
					}
					if (a[orderKey] < b[orderKey]) {
						return -dNum;
					} else {
						return 0;
					}
				});
			}
		}
	}
}
