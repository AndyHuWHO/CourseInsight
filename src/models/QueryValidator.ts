import {FilterType, Query,Key,MKey,SKey,MField,SField, IdString} from "./Query";

export class QueryValidator {
	public static validateQuery(query: unknown): boolean {
		// query must be an object
		 if (!isObject(query)) {
			 return false;
		 }
		 // query must have body and options
		 if (!("WHERE" in query) || !("OPTIONS" in query)) {
			return false;
		 }
		 // query has no more than 2 keys
		 if (Object.keys(query).length !== 2) {
			 return false;
		 }
		 // query body and options both have to be objects
		 if (!isObject(query.WHERE) || !isObject(query.OPTIONS)){
			 return  false;
		 }
		 // if both body and options are valid, query is valid
		 return validateWhere(query.WHERE) && validateOptions(query.OPTIONS);
	}

}
function isObject(value: unknown): value is object {
	return typeof value === "object" && value !== null;
}


function validateWhere(where: object): boolean {
	// Empty where is valid
	if (Object.keys(where).length === 0) {
		return true;
	}
	// there's only 1 object in WHERE if there's any
	if (Object.keys(where).length > 1) {
		return false;
	}
	const filterKey = Object.keys(where)[0];
	if (!["AND", "OR", "GT", "LT", "EQ", "IS", "NOT"].includes(filterKey)) {
		return false;
	}
	return validateFilter(where);
	// switch (filterKey) {
	// 	case "AND":
	// 		break;
	// 	case "OR":
	// 		break;
	// 	case "GT":
	// 		break;
	// 	case "LT":
	// 		break;
	// 	case "EQ":
	// 		break;
	// 	case "IS":
	// 		break;
	// 	case "NOT":
	// 		break;
	// 	default:
	// 		return false;
	// }
}
function validateFilter(where: object) {
	// !!! recursion?
	return false;
}

function validateOptions(options: object): boolean {
	const optionsLength = Object.keys(options).length;
	// options must have columns
	if (!("COLUMNS" in options)) {
		return false;
	}
	// options should have at most 2 keys, being columns and order
	if (optionsLength > 2) {
		return false;
	}
	// columns must be an array of strings
	if (!isArrayOfStrings(options.COLUMNS)) {
		return false;
	}
	// when options only have 1 key, validate columns, columns will be treated as an array of strings due to previous check
	if (optionsLength === 1) {
		return validateColumns(options.COLUMNS);
	}
	// if options has more keys than just columns, it must have order key. And need to validate both columns and order
	if(optionsLength === 2) {
		// nesting this so typescript could figure out order is in options
		if (!("ORDER" in options)) {
			return false;
		}else {
			return validateColumns(options.COLUMNS) && validateOrder(options.ORDER, options.COLUMNS);
		}
	}
	return false;
}

const idStringPattern: RegExp = /^[^_]+$/;
const mKeyPattern: RegExp = /^"[^_]+_(avg|pass|fail|audit|year)"$/;
const sKeyPattern: RegExp = /^"[^_]+_(dept|id|instructor|title|uuid)"$/;
function validateColumns(columns: string[]) {
	for (const column of columns) {
		if (!(mKeyPattern.test(column) || sKeyPattern.test(column))) {
			return false;
		}
	}
	return true;
}
function validateOrder(order: any, columns: string[]) {
	// order must be a string
	if (typeof order !== "string") {
		return false;
	}
	// order must be one of the strings in columns, order is treated as a string due to previous check
	if (!columns.includes(order)) {
		return false;
	}
	// order is a string and it is one of the strings in columns
	return true;
}

function isArrayOfStrings(variable: any): variable is string[] {
	if (!Array.isArray(variable)) {
		return false;
	}
	// Check if every element in the array is a string
	return variable.every((element) => typeof element === "string");
}
