export default class Building {

	private fullName: string;
	private shortName: string;
	private address: string;
	// private lat: number;
	// lon: number;
	private buildingHREF: string;

	constructor(fullName: string, shortName: string, address: string, buildingHREF: string) {
		this.fullName = fullName;
		this.shortName = shortName;
		this.address = address;
		this.buildingHREF = buildingHREF;
	}

	public getGeolocation(address: string) {

	}
}
