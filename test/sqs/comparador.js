const Comparador = require("../../lib/sqs/comparador");

const {expect} = require("chai");

describe("SQS - Comparador", function(){

	it("Compara literales", function(){

		expect(Comparador("a", "a")).to.equal(true);

		expect(Comparador(1, 1)).to.equal(true);

		expect(Comparador(1.6, 1.6)).to.equal(true);

		expect(Comparador("a", "A")).to.equal(false);

	})

	it("Compara objetos simples", function(){

		expect(Comparador({

			a: 1,
			b: 2

		}, {

			a: 1

		})).to.equal(true);

		expect(Comparador(

			{a: 1},

			{b: 1}


		)).to.equal(false);

		expect(Comparador(

			{a: 1, b: 2, c: "D"},

			{b: 2, c: "D"}

		)).to.equal(true);

	})

	it("Compara objetos complejos", function(){

		let a = {

			c: {

				c1: 100,
		
				c2: 100.5

			},

			s: {

				M: {

					a: "A",

					b: "B"

				}

			}

		}

		expect(Comparador(a, {

			c: {
				c2: 100.5,
			},

			s: {

				M: {
					b: "B"
				}

			}

		})).to.equal(true);


	})


})
