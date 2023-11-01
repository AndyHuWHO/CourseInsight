import {InsightDatasetKind} from "../controller/IInsightFacade";
import {InsightKind} from "./InsightKind";

// represents a section
export default class Section implements InsightKind{
	public readonly uuid: string; // identifier for the section
	public readonly id: string; // course identifier
	public readonly title: string;
	public readonly instructor: string;
	public readonly dept: string;
	public readonly year: number;
	public readonly avg: number;
	public readonly pass: number;
	public readonly fail: number;
	public readonly audit: number;

	constructor(
		uuid: string,
		id: string,
		title: string,
		instructor: string,
		dept: string,
		year: number,
		avg: number,
		pass: number,
		fail: number,
		audit: number
	) {
		this.uuid = uuid;
		this.id = id;
		this.title = title;
		this.instructor = instructor;
		this.dept = dept;
		this.year = year;
		this.avg = avg;
		this.pass = pass;
		this.fail = fail;
		this.audit = audit;
	}

	public equals(other: Section): boolean {
		// Compare each property
		return (
			this.uuid === other.uuid &&
			this.id === other.id &&
			this.title === other.title &&
			this.instructor === other.instructor &&
			this.dept === other.dept &&
			this.year === other.year &&
			this.avg === other.avg &&
			this.pass === other.pass &&
			this.fail === other.fail &&
			this.audit === other.audit
		);
	}

	[key: string]: any;
}
