import {InsightKind} from "./InsightKind";

export function findIntersection(array1: InsightKind[], array2: InsightKind[]): InsightKind[] {
	const set1 = new Set(array1);
	const intersection = array2.filter((item) => {
		for (const element of set1) {
			if (item.equals(element)) {
				return true;
			}
		}
		return false;
	});
	return intersection;
}

export function combineUnique(arr1: InsightKind[], arr2: InsightKind[]) {
	const combinedSet = new Set([...arr1, ...arr2]);
	return Array.from(combinedSet);
}

export function getDifference(arr1: InsightKind[], arr2: InsightKind[]): any[] {
	return arr1.filter((item) => !arr2.includes(item));
}

export function passSComparison(sField: string, inputString: string, section: InsightKind) {
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

export function isString(value: any): value is string {
	return typeof value === "string";
}
