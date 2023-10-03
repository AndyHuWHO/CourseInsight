import {InsightDataset, InsightDatasetKind} from "../controller/IInsightFacade";

// represents a dataset
export class Dataset implements InsightDataset {

	public readonly id: string;
	public readonly kind: InsightDatasetKind;
	public readonly numRows: number;
	public readonly sections: number;

	constructor(id: string, kind: InsightDatasetKind, numRows: number, sections: number) {
		this.id = id;
		this.kind = kind;
		this.numRows = numRows;
		this.sections = sections;
	}

}
