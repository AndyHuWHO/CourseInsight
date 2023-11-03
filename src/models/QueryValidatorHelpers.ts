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


export function checkForDuplicateKeys(arrayOfObjects: any[]): boolean {
	let keySet = new Set<string>();

	for (let obj of arrayOfObjects) {
		keySet.add(Object.keys(obj)[0]);
	}
	return keySet.size < arrayOfObjects.length;
}
