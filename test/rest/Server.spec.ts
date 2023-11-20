import Server from "../../src/rest/Server";
import InsightFacade from "../../src/controller/InsightFacade";

import {expect} from "chai";
import request, {Response} from "supertest";

import * as fs from "fs-extra";

describe("Facade D3", function () {

	let facade: InsightFacade;
	let server: Server;


	before(function () {
		facade = new InsightFacade();
		server = new Server(4321);
		// TODO: start server here once and handle errors properly
		server.start().then(() => {
			console.info("App::initServer() - started");
		}).catch((err: Error) => {
			console.error(`App::initServer() - ERROR: ${err.message}`);
		});
	});

	after(function () {
		// TODO: stop server here once!
		server.stop().then(() => {
			console.info("App::stopServer() - stopped");
		}).catch((err: Error) => {
			console.error(`App::stopServer() - ERROR: ${err.message}`);
		});
	});

	beforeEach(function () {
		// might want to add some process logging here to keep track of what is going on
	});

	afterEach(function () {
		// might want to add some process logging here to keep track of what is going on
	});

	// Sample on how to format PUT requests
	it("PUT test for courses dataset success", function () {
		try {
			return request("http://localhost:4321/")
				.put("/dataset/ubc/sections")
				.send(fs.readFileSync("test/resources/archives/pair.zip"))
				.set("Content-Type", "application/x-zip-compressed")
				.then(function (res: Response) {
					// some logging here please!
					console.log("reached response of a success PUT request");
					expect(res.status).to.be.equal(200);
					expect(res.body).to.be.equal(["ubc"]);
				})
				.catch(function (err) {
					// some logging here please!
					console.error("error with success PUT request with error: " + err.message);
					expect.fail();
				});
		} catch (err) {
			// and some more logging here!
			console.error("error with success PUT request with error: " + err);
		}
	});

	it("PUT test for courses dataset fail", function () {
		try {
			return request("http://localhost:4321/")
				.put("/dataset/ubc_1/sections")
				.send(fs.readFileSync("test/resources/archives/pair.zip"))
				.set("Content-Type", "application/x-zip-compressed")
				.then(function (res: Response) {
					// some logging here please!
					console.log("reached response of a fail PUT request");
					expect(res.status).to.be.equal(400);
				})
				.catch(function (err) {
					// some logging here please!
					console.error("error with fail PUT request with error: " + err.message);
					expect.fail();
				});
		} catch (err) {
			// and some more logging here!
			console.error("error with fail PUT request with error: " + err);
		}
	});

	// The other endpoints work similarly. You should be able to find all instructions at the supertest documentation
	it("DELETE test for courses dataset success", function () {
		try {
			return request("http://localhost:4321/")
				.delete("/dataset/ubc")
				.then(function (res: Response) {
					// some logging here please!
					console.log("reached response of a success DELETE request");
					expect(res.status).to.be.equal(200);
					expect(res.body).to.be.equal("ubc");
				})
				.catch(function (err) {
					// some logging here please!
					console.error("error with success DELETE request with error: " + err.message);
					expect.fail();
				});
		} catch (err) {
			// and some more logging here!
			console.error("error with success DELETE request with error: " + err);
		}
	});

	it("DELETE test for courses dataset fail with invalid ID", function () {
		try {
			return request("http://localhost:4321/")
				.delete("/dataset/ubc_1")
				.then(function (res: Response) {
					// some logging here please!
					console.log("reached response of a fail DELETE request");
					expect(res.status).to.be.equal(400);
				})
				.catch(function (err) {
					// some logging here please!
					console.error("error with fail DELETE request with error: " + err.message);
					expect.fail();
				});
		} catch (err) {
			// and some more logging here!
			console.error("error with fail DELETE request with error: " + err);
		}
	});


	it("DELETE test for courses dataset fail with ID not found", function () {
		try {
			return request("http://localhost:4321/")
				.delete("/dataset/ubc1")
				.then(function (res: Response) {
					// some logging here please
					console.log("reached response of a fail DELETE request");
					expect(res.status).to.be.equal(404);
				})
				.catch(function (err) {
					// some logging here please!
					console.error("error with fail DELETE request with error: " + err.message);
					expect.fail();
				});
		} catch (err) {
			// and some more logging here!
			console.error("error with fail DELETE request with error: " + err);
		}
	});

	it("GET test for courses dataset", function () {
		try {
			return request("http://localhost:4321/")
				.get("/datasets")
				.then(function (res: Response) {
					// some logging here please!
					console.log("reached response of a success GET request");
					expect(res.status).to.be.equal(200);
					expect(res.body).to.be.equal([]);
				})
				.catch(function (err) {
					// some logging here please!
		            console.error("error with success GET request with error: " + err.message);
					expect.fail();
				});
		} catch (err) {
			// and some more logging here!
			console.error("error with success GET request with error: " + err);
		}
	});

	it("POST test for courses dataset success", function () {
		try {
			return request("http://localhost:4321/")
				.post("/query")
				.send(fs.readFileSync("test/resources/apiTestQuery/testQuery.json", "utf-8"))
				.set("Content-Type", "'application/json'")
				.then(function (res: Response) {
					// some logging here please!
					console.log("reached response of a success POST request");
					expect(res.status).to.be.equal(200);
					expect(res.body).to.be.equal([
						{
							sections_dept: "cnps",
							sections_year: 2012,
							sections_avg: 99.19
						},
						{
							sections_dept: "cnps",
							sections_year: 2013,
							sections_avg: 96.33
						}
					]);
				})
				.catch(function (err) {
					// some logging here please!
					console.error("error with success POST request with error: " + err.message);
					expect.fail();
				});
		} catch (err) {
			// and some more logging here!
			console.error("error with success POST request with error: " + err);
		}
	});


	it("POST test for courses dataset fail", function () {
		try {
			return request("http://localhost:4321/")
				.post("/query")
				.send(fs.readFileSync("test/resources/apiTestQuery/testInvalidQuery.json", "utf-8"))
				.set("Content-Type", "'application/json'")
				.then(function (res: Response) {
					// some logging here please!
					console.log("reached response of a fail POST request");
					expect(res.status).to.be.equal(400);
				})
				.catch(function (err) {
					// some logging here please!
					console.error("error with fail POST request with error: " + err.message);
					expect.fail();
				});
		} catch (err) {
			// and some more logging here!
			console.error("error with fail POST request with error: " + err);
		}
	});


});
