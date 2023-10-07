// import {FilterType, Query,Key,MKey,SKey,MField,SField, IdString} from "./Query";

export class QueryValidator {
	private _idString: string = "";
	// regex for idString, mKey, and sKey
	private idStringPattern: RegExp = /^[^_]+$/;
	private inputStringPattern: RegExp = /^((\*)?[^*]*(\*)?)$/;
	private mKeyPattern: RegExp = /^"[^_]+_(avg|pass|fail|audit|year)"$/;
	private sKeyPattern: RegExp = /^"[^_]+_(dept|id|instructor|title|uuid)"$/;

	public validateQuery(query: unknown): boolean {
		// query must be an object
		 if (!this.isObject(query)) {
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
		 console.log("ready to validate body and options");
		 // query body and options both have to be objects
		 // if (!this.isObject(query.WHERE) || !this.isObject(query.OPTIONS)){
			//  return  false;
		 // }
		 // if both body and options are valid, query is valid
		 return this.validateWhere(query.WHERE) && this.validateOptions(query.OPTIONS);
	}

	 private isObject(value: unknown): value is object {
		return typeof value === "object" && value !== null;
	}


	 private validateWhere(where: any): boolean {
		if (!this.isObject(where)) {
			return false;
		}
		// Empty where is valid
		if (Object.keys(where).length === 0) {
			return true;
		}
		// there's only 1 object in WHERE if there's any
		if (Object.keys(where).length > 1) {
			return false;
		}
		// if there's only one object, check if it's a valid filter
		if (Object.keys(where).length === 1) {
			console.log("ready to validate filter");
			return this.validateFilter(where);
		}
		return false;
	}

// known that the key in where is a valid filter key
	private validateFilter(filter: any): boolean {
		if (!this.isObject(filter)) {
			return false;
		}
		// const s = JSON.stringify(filter);
		// const j = JSON.parse(s);
		const filterKey = Object.keys(filter)[0];
		if (!this.isString(filterKey)) {
			return false;
		}
		const filterValue = Object.values(filter)[0];
		// make sure that the key in where is a valid filter key
		if (["AND", "OR", "GT", "LT", "EQ", "IS", "NOT"].includes(filterKey)) {
			return false;
		}
		// !!!
		if ("IS" in filter) {
			console.log("ready to validate IS");
			return this.validateSComparison(filter.IS);
		}
		if ("NOT" in filter) {
			return this.validateFilter(Object.values(filter)[0]);
		}
		if (filterKey === "AND" || filterKey === "OR") {
			return this.validateLogicComparison(filterValue);
		}
		if (filterKey === "GT" || filterKey === "LT" || filterKey === "EQ") {
			return this.validateMComparison(filterValue);
		}
		return false;
	}

	private validateSComparison(sComparison: any): boolean {
		if (!this.isObject(sComparison)) {
			return false;
		}
		if (Object.keys(sComparison).length !== 1) {
			return false;
		}
		// validate sKey
		const sKey: string = Object.keys(sComparison)[0] as keyof typeof sComparison;
		// sKey has to be a string
		if (!this.isString(sKey)) {
			return false;
		}
		// sKey has to follow the sKeyPattern
		if (!(this.sKeyPattern.test(sKey))) {
			return false;
		}
		// sKey's idString has to be valid
		const id = sKey.split("_")[0];
		if (this._idString === "") {
			this._idString = id;
		} else {
			return id === this.idString;
		}

		// validate inputString
		const inputString: any = Object.values(sComparison)[0];
		return this.validateInputString(inputString);
	}

	private validateInputString(inputString: any): boolean {
		if (!this.isString(inputString)) {
			return false;
		}
		if (!this.inputStringPattern.test(inputString)) {
			return false;
		}
		return true;
	}

	private validateMComparison(mComparison: any): boolean {
		if (!this.isObject(mComparison)) {
			return false;
		}
		if (Object.keys(mComparison).length !== 1) {
			return false;
		}
		// validate mKey
		const mKey: string = Object.keys(mComparison)[0];
		// sKey has to be a string
		if (!this.isString(mKey)) {
			return false;
		}
		// mKey has to follow the mKeyPattern
		if (!(this.mKeyPattern.test(mKey))) {
			return false;
		}
		// mKey's idString has to be valid
		const id = mKey.split("_")[0];
		if (this._idString === "") {
			this._idString = id;
		} else {
			return id === this.idString;
		}
		const mKeyValue: any = Object.values(mComparison)[0];
		return typeof mKeyValue === "number";
	}

	private validateLogicComparison(logic: any): boolean {
		if (!Array.isArray(logic)) {
			return false;
		}
		if(logic.length === 0) {
			return false;
		}
		for (const item of logic) {
			return this.validateFilter(item);
		}
		return false;
	}


	private validateOptions(options: any): boolean {
		if (!this.isObject(options)) {
			return false;
		}
		const optionsLength = Object.keys(options).length;
		// options must have columns
		if (!("COLUMNS" in options)) {
			return false;
		}
		// options should have at most 2 keys, being columns and order
		if (optionsLength > 2) {
			return false;
		}
		// columns must be an array of strings. check this here, so we don't have to check it later in both columns and order
		// if (!this.isArrayOfStrings(options.COLUMNS)) {
		// 	return false;
		// }
		// when options only have 1 key, validate columns, columns will be treated as an array of strings due to previous check
		if (optionsLength === 1) {
			return this.validateColumns(options.COLUMNS);
		}
		// if options has more keys than just columns, it must have order key. And need to validate both columns and order
		if(optionsLength === 2) {
			// nesting this so typescript could figure out order is in options
			if (!("ORDER" in options)) {
				return false;
			}else {
				return this.validateColumns(options.COLUMNS) && this.validateOrder(options.ORDER, options.COLUMNS);
			}
		}
		return false;
	}

	private validateColumns(columns: any) {
		if (!this.isArrayOfStrings(columns)) {
			return false;
		}
		const n = columns.length;
		// each string in columns must be either an mKey or an sKey
		for (let i = 0; i < n; i++) {
			if (!(this.mKeyPattern.test(columns[i]) || this.sKeyPattern.test(columns[i]))) {
				return false;
			}
			// make sure all the idString are the same, otherwise, can't query multiple data set error
			if (i === 0 && this._idString === "") {
				this._idString = columns[i].split("_")[0];
			} else {
				if (columns[i].split("_")[0] !== this._idString) {
					return false;
				}
			}
		}
		return true;
	}
	private validateOrder(order: any, columns: any) {
		if (!this.isArrayOfStrings(columns)) {
			return false;
		}
		// order must be a string
		if (!this.isString(order)) {
			return false;
		}
		// order must be one of the strings in columns, order is treated as a string due to previous check
		if (!columns.includes(order)) {
			return false;
		}
		// order is a string and it is one of the strings in columns
		return true;
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

