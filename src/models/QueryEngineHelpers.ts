import {InsightKind} from "./InsightKind";
import Decimal from "decimal.js";

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
	let fieldValue = section[sField];
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

export function calculateApply(insightKindGroup: InsightKind[], applyTokenObject: any): number {
	const applyToken = Object.keys(applyTokenObject)[0];
	const applyKey = Object.values(applyTokenObject)[0] as string;
	const applyField = applyKey.split("_")[1];
	let max = Number.NEGATIVE_INFINITY;
	let min = Number.POSITIVE_INFINITY;
	let sum: Decimal = new Decimal(0);
	let avg = 0;
	let decimalCount: Decimal = new Decimal(0);
	let count = 0;
	let uniqueFieldValueSet = new Set();
	switch (applyToken) {
		case "MAX":
			for (let item of insightKindGroup) {
				if (item[applyField] > max) {
					max = item[applyField];
				}
			}
			return max;
		case "MIN":
			for (let item of insightKindGroup) {
				if (item[applyField] < min) {
					min = item[applyField];
				}
			}
			return min;
		case "SUM":
			for (let item of insightKindGroup) {
				sum = sum.add(new Decimal(item[applyField] as number));
			}
			return Number(sum.toFixed(2));
		case "AVG":
			for (let item of insightKindGroup) {
				sum = sum.add(new Decimal(item[applyField] as number));
			}
			avg = sum.toNumber() / insightKindGroup.length;
			return Number(avg.toFixed(2));
		case "COUNT":
			for (let item of insightKindGroup) {
				uniqueFieldValueSet.add(item[applyField]);
			}
			count = uniqueFieldValueSet.size;
			return count;
	}
	return 0;
}
