import {InsightDataset, InsightDatasetKind} from "../controller/IInsightFacade";
import Section from "./Section";
import Room from "./Room";

// represents a dataset
export class RoomDataset implements InsightDataset {
	public readonly id: string;
	public readonly kind: InsightDatasetKind;
	public readonly numRows: number; // number of valid rooms
	public readonly rooms: Room[];

	constructor(id: string, kind: InsightDatasetKind, numRows: number, rooms: Room[]) {
		this.id = id;
		this.kind = kind;
		this.numRows = numRows;
		this.rooms = rooms;
	}
}
