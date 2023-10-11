// import {FilterType, Query,Key,MKey,SKey,MField,SField, IdString} from "./Query";

import {InsightError} from "../controller/IInsightFacade";

export class QueryValidator {
	public _idString: string = "";
	// regex for idString, mKey, and sKey
	private idStringPattern: RegExp = /^[^_]+$/;
	private inputStringPattern: RegExp = /^((\*)?[^*]*(\*)?)$/;
	private mKeyPattern: RegExp = /^[^_]+_(avg|pass|fail|audit|year)$/;
	private sKeyPattern: RegExp = new RegExp(/^[^_]+_(dept|id|instructor|title|uuid)$/) ;


	public validateQuery(query: unknown)  {
		// query must be an object
		 if (!this.isObject(query)) {
			 throw new InsightError("query not an object");
		 }
		 // query must have body and options
		 if (!("WHERE" in query)) {
			 throw new InsightError("query missing where");
		 }
		if (!("OPTIONS" in query)) {
			throw new InsightError("query missing options");
		}
		 // query has no more than 2 keys
		 if (Object.keys(query).length !== 2) {
			 throw new InsightError("query have more than 2 keys");
		 }
		 console.log("ready to validate body and options");
		 // query body and options both have to be objects
		 // if (!this.isObject(query.WHERE) || !this.isObject(query.OPTIONS)){
			//  return  false;
		 // }
		 // if both body and options are valid, query is valid
		 this.validateWhere(query.WHERE);
		this.validateOptions(query.OPTIONS);
	}

	 private isObject(value: unknown): value is object {
		return typeof value === "object" && value !== null;
	}


	 private validateWhere(where: any) {
		if (!this.isObject(where)) {
			throw new InsightError("body is not object");
		}
		// Empty where is valid
		// if (Object.keys(where).length === 0) {
		// 	return true;
		// }
		// there's only 1 object in WHERE if there's any
		if (Object.keys(where).length > 1) {
			throw new InsightError("body have more than one key");
		}
		// if there's only one object, check if it's a valid filter
		if (Object.keys(where).length === 1) {
			console.log("ready to validate filter");
			this.validateFilter(where);
		}
	}

// known that the key in where is a valid filter key
	private validateFilter(filter: any) {
		if (!this.isObject(filter)) {
			throw new InsightError("filter must be an object");
		}
		// const s = JSON.stringify(filter);
		// const j = JSON.parse(s);
		const filterKey = Object.keys(filter)[0];
		if (!this.isString(filterKey)) {
			throw new InsightError("filter key must be a string");
		}
		const filterValue = Object.values(filter)[0];
		// make sure that the key in where is a valid filter key
		if (!["AND", "OR", "GT", "LT", "EQ", "IS", "NOT"].includes(filterKey)) {
			throw new InsightError("invalid filter key");
		}
		// !!!
		if ("IS" in filter) {
			console.log("ready to validate IS");
			this.validateSComparison(filter.IS);
		}
		if ("NOT" in filter) {
			this.validateFilter(Object.values(filter)[0]);
		}
		if (filterKey === "AND" || filterKey === "OR") {
			this.validateLogicComparison(filterValue);
		}
		if (filterKey === "GT" || filterKey === "LT" || filterKey === "EQ") {
			this.validateMComparison(filterValue);
		}
	}

	private validateSComparison(sComparison: any) {
		if (!this.isObject(sComparison)) {
			throw new InsightError("sComparison not an object");
		}
		if (Object.keys(sComparison).length !== 1) {
			throw new InsightError("sComparison does not have exactly one key");
		}
		// validate sKey
		const sKey: string = Object.keys(sComparison)[0] as keyof typeof sComparison;
		// sKey has to be a string
		if (!this.isString(sKey)) {
			throw new InsightError("sKey not a string");
		}
		// sKey has to follow the sKeyPattern
		if (!(this.sKeyPattern.test(sKey))) {
			throw new InsightError("invalid sKey");
		}
		// sKey's idString has to be valid
		const id = sKey.split("_")[0];
		if (this._idString === "") {
			this._idString = id;
		} else {
			if (id !== this.idString){
				throw new InsightError("sComparison has different idString");
			};
		}

		// validate inputString
		const inputString: any = Object.values(sComparison)[0];
		this.validateInputString(inputString);
	}

	private validateInputString(inputString: any) {
		if (!this.isString(inputString)) {
			throw new InsightError("sComparison input string not a string");
		}
		if (!this.inputStringPattern.test(inputString)) {
			throw new InsightError("invalid sComparison input string");
		}
	}

	private validateMComparison(mComparison: any) {
		if (!this.isObject(mComparison)) {
			throw new InsightError("mComparison not an object");
		}
		if (Object.keys(mComparison).length !== 1) {
			throw new InsightError("mComparison does not have exactly 1 key");
		}
		// validate mKey
		const mKey: string = Object.keys(mComparison)[0];
		// sKey has to be a string
		if (!this.isString(mKey)) {
			throw new InsightError("mKey not a string");
		}
		// mKey has to follow the mKeyPattern
		if (!(this.mKeyPattern.test(mKey))) {
			throw new InsightError("invalid mKey");
		}
		// mKey's idString has to be valid
		const id = mKey.split("_")[0];
		if (this._idString === "") {
			this._idString = id;
		} else {
			if (id !== this.idString){
				throw new InsightError("mComparison has different idString");
			};
		}
		const mKeyValue: any = Object.values(mComparison)[0];
		if (typeof mKeyValue !== "number") {
			throw new InsightError("mKey must be a number");
		};
	}

	private validateLogicComparison(logic: any) {
		if (!Array.isArray(logic)) {
			throw new InsightError("logicComparison must be an array");
		}
		const logicLength = logic.length;
		if(logicLength === 0) {
			throw new InsightError("logicComparison can't be an empty array");
		}
		for (let item of logic) {
			this.validateFilter(item);
		}
	}


	private validateOptions(options: any) {
		if (!this.isObject(options)) {
			throw new InsightError("Options must be an object");
		}
		const optionsLength = Object.keys(options).length;
		// options must have columns
		if (!("COLUMNS" in options)) {
			throw new InsightError("Options must have columns");
		}
		// options should have at most 2 keys, being columns and order
		if (optionsLength > 2) {
			throw new InsightError("Options must not have more than 2 items");
		}
		// columns must be an array of strings. check this here, so we don't have to check it later in both columns and order
		// if (!this.isArrayOfStrings(options.COLUMNS)) {
		// 	return false;
		// }
		// when options only have 1 key, validate columns, columns will be treated as an array of strings due to previous check
		if (optionsLength === 1) {
			this.validateColumns(options.COLUMNS);
		}
		// if options has more keys than just columns, it must have order key. And need to validate both columns and order
		if(optionsLength === 2) {
			// nesting this so typescript could figure out order is in options
			if (!("ORDER" in options)) {
				throw new InsightError("Options must only have order other than columns");
			}else {
				this.validateColumns(options.COLUMNS);
				this.validateOrder(options.ORDER, options.COLUMNS);
			}
		}
	}

	private validateColumns(columns: any) {
		if (!this.isArrayOfStrings(columns)) {
			throw new InsightError("Columns must be an array of strings");
		}
		const n = columns.length;
		// each string in columns must be either an mKey or an sKey
		for (let i = 0; i < n; i++) {
			if (!(this.mKeyPattern.test(columns[i]) || this.sKeyPattern.test(columns[i]))) {
				throw new InsightError("Columns keys must a valid m or s Key");
			}
			// make sure all the idString are the same, otherwise, can't query multiple data set error
			if (i === 0 && this._idString === "") {
				this._idString = columns[i].split("_")[0];
			} else {
				if (columns[i].split("_")[0] !== this._idString) {
					throw new InsightError("Columns have different idString");
				}
			}
		}
	}
	private validateOrder(order: any, columns: any) {
		if (!this.isArrayOfStrings(columns)) {
			throw new InsightError("Columns must be an array of strings");
		}
		// order must be a string
		if (!this.isString(order)) {
			throw new InsightError("Order must be a strings");
		}
		// order must be one of the strings in columns, order is treated as a string due to previous check
		if (!columns.includes(order)) {
			throw new InsightError("Order key must appear in columns");
		}
	}

	private isString(value: any): value is string {
		return typeof value === "string";
	}

	private isArrayOfStrings(variable: any): variable is string[] {
		if (!Array.isArray(variable)) {
			return false;
		}
		// Check if every element in the array is a string
		return variable.every((element) => typeof element === "string");
	}
	private get idString(): string {
		return this._idString;
	}

}

