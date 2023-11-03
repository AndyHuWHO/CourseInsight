import {InsightDatasetKind} from "../controller/IInsightFacade";
import {InsightKind} from "./InsightKind";
// represents a section
export default class Room implements InsightKind {
	public readonly fullname: string; // full building name
	public readonly shortname: string; // short building name
	public readonly number: string; // room number
	public readonly name: string; // rooms_shortname+rooms_number
	public readonly address: string;
	public readonly lat: number;
	public readonly lon: number;
	public readonly seats: number;
	public readonly type: string;
	public readonly furniture: string;
	public readonly href: string; // link to full details online

	constructor(
		fullName: string,
		shortname: string,
		number: string,
		address: string,
		lat: number,
		lon: number,
		seats: number,
		type: string,
		furniture: string,
		href: string
	) {
		this.fullname = fullName;
		this.shortname = shortname;
		this.number = number;
		this.name = this.shortname + "_" + this.number; // !!!
		this.address = address;
		this.lat = lat;
		this.lon = lon;
		this.seats = seats;
		this.type = type;
		this.furniture = furniture;
		this.href = href;
	}

	public equals(other: Room): boolean {
		// Compare each property
		return (
			this.fullname === other.fullname &&
			this.shortname === other.shortname &&
			this.number === other.number &&
			this.name === other.name &&
			this.address === other.address &&
			this.lat === other.lat &&
			this.lon === other.lon &&
			this.seats === other.seats &&
			this.type === other.type &&
			this.furniture === other.furniture &&
			this.href === other.href
		);
	}

	[key: string]: any;
}
