import {InsightError} from "../controller/IInsightFacade";

const inputStringPattern: RegExp = /^((\*)?[^*]*(\*)?)$/;
const idStringPattern: RegExp = /^[^_]+$/;
export const mKeyPattern: RegExp = /^[^_]+_(avg|pass|fail|audit|year|lat|lon|seats)$/;
export const applyKeyPattern: RegExp = /^[^_]+$/;
export const applyTokens = ["MAX", "MIN", "AVG", "COUNT", "SUM"];

export const sKeyPattern: RegExp = new RegExp(
	/^[^_]+_(dept|id|instructor|title|uuid|fullname|shortname|number|name|address|type|furniture|href)$/
);
export function isObject(value: unknown): value is object {
	return typeof value === "object" && value !== null;
}

export function isString(value: any): value is string {
	return typeof value === "string";
}

export function validateInputString(inputString: any) {
	if (!isString(inputString)) {
		throw new InsightError("sComparison input string not a string");
	}
	if (!inputStringPattern.test(inputString)) {
		throw new InsightError("invalid sComparison input string");
	}
}

export function isArrayOfStrings(variable: any): variable is string[] {
	if (!Array.isArray(variable)) {
		return false;
	}
	// Check if every element in the array is a string
	return variable.every((element) => typeof element === "string");
}


// if (this.applyKeyList.length !== 0 && !this.applyKeyList.includes(columns[i])) {
// 	throw new InsightError("Keys in COLUMNS must be in GROUP or APPLY when TRANSFORMATIONS is present");
// } else {
// 	if (!(mKeyPattern.test(columns[i]) || sKeyPattern.test(columns[i]))) {
// 		throw new InsightError("Columns keys must a valid m or s Key");
// 	}
// 	if (i === 0 && this._idString === "") {
// 		this._idString = columns[i].split("_")[0];
// 	} else {
// 		if (columns[i].split("_")[0] !== this._idString) {
// 			throw new InsightError("Columns have different idString");
// 		}
// 	}
// }
