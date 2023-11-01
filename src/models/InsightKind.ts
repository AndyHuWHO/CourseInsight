import {InsightDatasetKind} from "../controller/IInsightFacade";

export interface InsightKind {
	equals(other: InsightKind): boolean;
    [key: string]: any;
}
