// This file contains functions to perform validation related tasks

import JSZip from "jszip";
import {InsightDatasetKind} from "../controller/IInsightFacade";
import * as parse5 from "parse5";

export default class ValidationUtil {
	// REQUIRES: string
	// EFFECTS: returns true if id does not have only white space and does not have an underscore, false otherwise
	public static isValidSyntaxID(id: string): boolean {
		return id.trim() !== "" && !id.includes("_");
	}

	// REQUIRES: content as base64 string
	// EFFECTS: returns true if content is base64 string
	public static async isValidZipBase64(content: string): Promise<boolean> {
		// check if input string is valid Base64
		let buffer: Buffer;
		try {
			buffer = Buffer.from(content, "base64");
		} catch (error) {
			// console.error("Invalid Base64 string:", error);
			return false;
		}
		// check if decoded buffer is valid ZIP
		try {
			const zip = new JSZip();
			await zip.loadAsync(buffer);
		} catch (error) {
			// console.error("Invalid ZIP data:", error);
			return false;
		}
		return true;
	}

	// REQUIRES: kind as InsightDatasetKind
	// EFFECTS: returns true if InsightDatasetKind is member 'sections' otherwise false
	public static isValidKind(kind: any): kind is InsightDatasetKind {
		// return Object.values(InsightDatasetKind).includes(kind as InsightDatasetKind);
		// for C0 and C1: only need sections
		return kind === InsightDatasetKind;
	}

	// REQUIRES: id as string and existingIds as string array
	// EFFECTS: returns true if id does not exist in existingIds, false otherwise
	//			this check is case-sensitive
	public static isUniqueId(id: string, existingIds: string[]): boolean {
		return !existingIds.includes(id);
	}
}
