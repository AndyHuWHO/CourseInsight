// import {FilterType, Query,Key,MKey,SKey,MField,SField, IdString} from "./Query";

import {InsightError} from "../controller/IInsightFacade";
import {isObject, isString, validateInputString, isArrayOfStrings} from "./queryValidationHelpers";

export class QueryValidator {
	public _idString: string = "";
	private applyKeyList: string[] = [];
	private mKeyPattern: RegExp = /^[^_]+_(avg|pass|fail|audit|year|lat|lon|seats)$/;
	private sKeyPattern: RegExp = new RegExp(
		/^[^_]+_(dept|id|instructor|title|uuid|fullname|shortname|number|name|address|type|furniture|href)$/
	);

	public validateQuery(query: unknown) {
		if (!isObject(query)) {
			throw new InsightError("query must be an object");
		}
		if (!("WHERE" in query)) {
			throw new InsightError("query is missing WHERE part");
		}
		if (!("OPTIONS" in query)) {
			throw new InsightError("query is missing OPTIONS part");
		}
		if (Object.keys(query).length > 3) {
			throw new InsightError("query have too many keys");
		}
		if (Object.keys(query).length === 3 && !("TRANSFORMATIONS" in query)) {
			throw new InsightError("query has invalid key when a third query key should be TRANSFORMATIONS");
		}
		this._idString = "";
		this.applyKeyList = [];
		console.log("ready to validate body, options, and transformation");
		this.validateWhere(query.WHERE);
		if ("TRANSFORMATIONS" in query) {
			this.validateTransformations(query.TRANSFORMATIONS);
		}
		this.validateOptions(query.OPTIONS);
	}

	private validateWhere(where: any) {
		if (!isObject(where) || Array.isArray(where)) {
			throw new InsightError("Invalid Where");
		}
		if (Object.keys(where).length > 1) {
			throw new InsightError("body have more than one key");
		}
		if (Object.keys(where).length === 1) {
			console.log("ready to validate filter");
			this.validateFilter(where);
		}
	}

	private validateFilter(filter: any) {
		if (!isObject(filter)) {
			throw new InsightError("filter must be an object");
		}
		const filterKey = Object.keys(filter)[0];
		if (!isString(filterKey)) {
			throw new InsightError("filter key must be a string");
		}
		const filterValue = Object.values(filter)[0];
		// make sure that the key in where is a valid filter key
		if (!["AND", "OR", "GT", "LT", "EQ", "IS", "NOT"].includes(filterKey)) {
			throw new InsightError("invalid filter key");
		}
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
		if (!isObject(sComparison)) {
			throw new InsightError("sComparison not an object");
		}
		if (Object.keys(sComparison).length !== 1) {
			throw new InsightError("sComparison does not have exactly one key");
		}
		const sKey: string = Object.keys(sComparison)[0] as keyof typeof sComparison;
		if (!isString(sKey)) {
			throw new InsightError("sKey not a string");
		}
		if (!this.sKeyPattern.test(sKey)) {
			throw new InsightError("invalid sKey");
		}
		const id = sKey.split("_")[0];
		if (this._idString === "") {
			console.log("inside validateSComparison " + id);
			this._idString = id;
		} else {
			if (id !== this.idString) {
				throw new InsightError("sComparison has different idString");
			}
		}
		const inputString: any = Object.values(sComparison)[0];
		validateInputString(inputString);
	}

	private validateMComparison(mComparison: any) {
		if (!isObject(mComparison)) {
			throw new InsightError("mComparison not an object");
		}
		if (Object.keys(mComparison).length !== 1) {
			throw new InsightError("mComparison does not have exactly 1 key");
		}
		// validate mKey
		const mKey: string = Object.keys(mComparison)[0];
		// sKey has to be a string
		if (!isString(mKey)) {
			throw new InsightError("mKey not a string");
		}
		// mKey has to follow the mKeyPattern
		if (!this.mKeyPattern.test(mKey)) {
			throw new InsightError("invalid mKey");
		}
		// mKey's idString has to be valid
		const id = mKey.split("_")[0];
		if (this._idString === "") {
			console.log("inside validateMComparison id:" + id);
			this._idString = id;
		} else {
			if (id !== this._idString) {
				throw new InsightError("mComparison has different idString");
			}
		}
		const mKeyValue: any = Object.values(mComparison)[0];
		if (typeof mKeyValue !== "number") {
			throw new InsightError("mValue must be a number");
		}
	}

	private validateLogicComparison(logic: any) {
		if (!Array.isArray(logic)) {
			throw new InsightError("logicComparison must be an array");
		}
		const logicLength = logic.length;
		if (logicLength === 0) {
			throw new InsightError("logicComparison can't be an empty array");
		}
		for (let item of logic) {
			this.validateFilter(item);
		}
	}

	private validateOptions(options: any) {
		if (!isObject(options)) {
			throw new InsightError("Options must be an object");
		}
		const optionsLength = Object.keys(options).length;
		if (!("COLUMNS" in options)) {
			throw new InsightError("Options must have columns");
		}
		if (optionsLength > 2) {
			throw new InsightError("Options must not have more than 2 items");
		}
		this.validateColumns(options.COLUMNS);
		if (optionsLength === 2) {
			if (!("ORDER" in options)) {
				throw new InsightError("Options must only have order other than columns");
			} else {
				this.validateOrder(options.ORDER, options.COLUMNS);
			}
		}
	}

	private validateColumns(columns: any) {
		if (!isArrayOfStrings(columns)) {
			throw new InsightError("Columns must be an array of strings");
		}
		const n = columns.length;
		if (n === 0) {
			throw new InsightError("Columns empty");
		}
		for (let i = 0; i < n; i++) {
			if (this.applyKeyList.length !== 0 && !this.applyKeyList.includes(columns[i])) {
				throw new InsightError("Keys in COLUMNS must be in GROUP or APPLY when TRANSFORMATIONS is present");
			} else {
				if (!(this.mKeyPattern.test(columns[i]) || this.sKeyPattern.test(columns[i]))) {
					throw new InsightError("Columns keys must a valid m or s Key");
				}
				if (i === 0 && this._idString === "") {
					this._idString = columns[i].split("_")[0];
				} else {
					if (columns[i].split("_")[0] !== this._idString) {
						throw new InsightError("Columns have different idString");
					}
				}
			}
		}
	}

	private validateOrder(order: any, columns: any) {
		if (isObject(order)) {
			const orderKeyLength = Object.keys(order).length;
			if (orderKeyLength !== 2 || !("dir" in order) || !("keys" in order)) {
				throw new InsightError("Invalid Order Object");
			}
			if (order.dir !== "UP" && order.dir !== "DOWN") {
				throw new InsightError("Invalid DIR");
			}
			if (!isArrayOfStrings(order.keys) || !order.keys.every((key) => columns.includes(key))) {
				throw new InsightError("Order key must appear in columns");
			}
		}
		if (!isString(order)) {
			throw new InsightError("Order must be a strings if not and object");
		}
		if (!columns.includes(order)) {
			throw new InsightError("Order key must appear in columns");
		}
	}

	private get idString(): string {
		return this._idString;
	}

	private validateTransformations(transformations: any) {
		if (!isObject(transformations) || Array.isArray(transformations)) {
			throw new InsightError("Invalid Transformation, Not an object");
		}
		const transLength = Object.keys(transformations).length;
		if (transLength !== 2) {
			throw new InsightError("Transformation has invalid number of keys");
		}
		if (!("GROUP" in transformations)) {
			throw new InsightError("Transformation is missing GROUP");
		}
		if (!("APPLY" in transformations)) {
			throw new InsightError("Transformation is missing APPLY");
		}
		this.validateGroup(transformations.GROUP);
		this.validateApply(transformations.APPLY);
	}

	private validateGroup(group: any) {
		throw new InsightError("Validation logic not implemented for Transformation");
	}

	private validateApply(apply: any) {
		throw new InsightError("Validation logic not implemented for Transformation");
	}
}
