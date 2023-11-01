import {InsightDataset, InsightDatasetKind} from "../controller/IInsightFacade";
import Section from "./Section";
import {InsightKind} from "./InsightKind";

// represents a dataset
export class Dataset implements InsightDataset {
	public readonly id: string;
	public readonly kind: InsightDatasetKind;
	public readonly numRows: number;
	public readonly insightKindArray: InsightKind[];

	constructor(id: string, kind: InsightDatasetKind, numRows: number, insightKindArray: InsightKind[]) {
		this.id = id;
		this.kind = kind;
		this.numRows = numRows;
		this.insightKindArray = insightKindArray;
	}
}
