const {expect} = require("chai");

const Receptor = require("../../lib/sqs/receptor.js");

describe("SQS - Receptor", function(){

	it("Recoge mensajes por id", function(){

		this.timeout(0);

		const qm = new SQSMock();

		const r = new Receptor(qm, "foo").iniciar();

		setTimeout(function(){

			qm.mensajes.push(

				{MessageId: "mensaje-1", Body: "{}"}

			);

		}, 100)

		return r.esperarMensajeId(

			"mensaje-1"

		).then((m) => {

			expect(m).to.be.an("object");

			return r.terminar();
		})
		

	})

	it("Se puede crear un receptor por contenido", function(hecho){

		this.timeout(0);

		const qm = new SQSMock();

		const r = new Receptor(qm, "foo").iniciar();

		const m = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"

		const mm = m.split('');

		const RECIBIDOS = [];

		let i = setInterval(function(){

			if(mm.length == 0){

				clearInterval(i);
	
				return r.terminar().then(() => {

					expect(RECIBIDOS.length).to.equal(m.length);

					hecho();

				})

			}

			qm.mensajes.push({

				MessageId: "mensaje-" + mm.length,

				Body: JSON.stringify({

					tipo: "LETRAS",

					letra: mm.shift(),

				})

			});

		}, 100)

		r.esperarMensajesContenido({

			tipo: "LETRAS"

		}, function(m){

			console.log(m)

			RECIBIDOS.push(m);

		})

	})




})


class SQSMock {

	constructor(){

		this.mensajes = [];

	}
	
	getMensajes(){

		return new Promise((cumplida, falla) => {

			setTimeout(() => {

				let mensajes = this.mensajes;

				this.mensajes = [];

				cumplida(mensajes);

			}, 500)

		});

	}

	borrarMensaje(){

		return Promise.resolve({});
	}

}
