export default class Building {
	public readonly fullName: string;
	public readonly shortName: string;
	public readonly address: string;
	public readonly buildingHREF: string;

	constructor(fullName: string, shortName: string, address: string, buildingHREF: string) {
		this.fullName = fullName;
		this.shortName = shortName;
		this.address = address;
		this.buildingHREF = buildingHREF;
	}
}
