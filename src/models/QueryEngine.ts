import {InsightDataset, InsightResult} from "../controller/IInsightFacade";
import {Query} from "./Query";
import {Dataset} from "./Dataset";

export class QueryEngine{

	public queryDataset (dataset: Dataset, query: any): Promise<InsightResult[]> {
		return Promise.reject("perform Not implemented.");
	}

}
