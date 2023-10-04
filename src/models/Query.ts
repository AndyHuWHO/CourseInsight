// import {
// 	IInsightFacade,
// 	InsightDatasetKind,
// 	InsightError,
// 	InsightResult,
// 	NotFoundError,
// 	ResultTooLargeError,
// } from "../../src/controller/IInsightFacade";
// import InsightFacade from "../../src/controller/InsightFacade";

export type MComparatorType =
	{LT: {[key: MKey]: number}} |
	{GT: {[key: MKey]: number}} |
	{EQ: {[key: MKey]: number}};

// type SComparatorType =
// 	{IS: {[key: string]: string};};
export interface SComparatorType {IS: {[key: SKey]: string};}

// type NegationType =
// 	{NOT:
// 			{FILTER: FilterType;};
// 	};
export interface NegationType {NOT:
			{FILTER: FilterType;};
	}

export type LogicComparisonType =
	{AND: {FILTER_LIST: FilterType[];}} |
	{OR: {FILTER_LIST: FilterType[];}}

export type FilterType = MComparatorType | SComparatorType | LogicComparisonType | NegationType;

// type OptionsType = {
// 	COLUMNS: string[];
// 	ORDER?: string;
// };
interface OptionsType {
	COLUMNS: Key[];
	ORDER?: Key;
}

type IdString = string;  // This represents [^_]+

type MField = "avg" | "pass" | "fail" | "audit" | "year";
type SField = "dept" | "id" | "instructor" | "title" | "uuid";

type MKey = `"${IdString}_${MField}"`;
type SKey = `"${IdString}_${SField}"`;

type Key = MKey | SKey;

export class Query {
	private BODY: FilterType;
	private OPTIONS: OptionsType;
	constructor(WHERE: FilterType, OPTIONS: OptionsType) {
		this.BODY = WHERE;
		this.OPTIONS = OPTIONS;
	}
}
