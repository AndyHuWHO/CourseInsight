import {InsightDataset, InsightDatasetKind} from "../controller/IInsightFacade";
import Section from "./Section";

// represents a dataset
export class Dataset implements InsightDataset {
	public readonly id: string;
	public readonly kind: InsightDatasetKind;
	public readonly numRows: number;
	public readonly sections: Section[];

	constructor(id: string, kind: InsightDatasetKind, numRows: number, sections: Section[]) {
		this.id = id;
		this.kind = kind;
		this.numRows = numRows;
		this.sections = sections;
	}
}
