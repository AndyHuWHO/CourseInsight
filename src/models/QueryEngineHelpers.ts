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
