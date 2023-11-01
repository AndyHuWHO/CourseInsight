import {InsightError} from "../controller/IInsightFacade";

const inputStringPattern: RegExp = /^((\*)?[^*]*(\*)?)$/;
const idStringPattern: RegExp = /^[^_]+$/;
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
