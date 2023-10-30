import {InsightDatasetKind} from "../controller/IInsightFacade";

// represents a section
export default class Room {
	public readonly fullName: string; // full building name
	public readonly shortName: string; // short building name
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
		this.fullName = fullName;
		this.shortName = shortname;
		this.number = number;
		this.name = this.shortName + "_" + this.number; // !!!
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
			this.fullName === other.fullName &&
			this.shortName === other.shortName &&
			this.number === other.number &&
			this.name === other.name &&
			this.address === other.address &&
			this.lat === other.lat &&
			this.lon === other.lon &&
			this.seats === other.setas &&
			this.type === other.type &&
			this.furniture === other.furniture &&
			this.href === other.href
		);
	}

	[key: string]: any;
}
