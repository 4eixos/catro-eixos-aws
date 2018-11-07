const ComparadorMensajeContenido = require("./comparador.js");

module.exports = class {

	constructor(sqs, qURL){

		this.sqs = sqs;
		this.qURL = qURL;

		this.__detectores = {};

		this.__salir = false;

		this.__enSalida = false;

		this.__nDetector = 1;

	}

	iniciar(){

		if(this.__bucleId) return this;
		
		this.__bucle();

		return this;
	}

	terminar(){

		this.__salir = true;

		return new Promise((cumplida, falla) => {

			this.__enSalida = cumplida;

		})

	}

	esperarMensajeId(mensajeID){

		return new Promise((cumplida, falla) => {
		
			const id = this.__crearDetector((mensaje) => {

				if(mensaje.MessageId == mensajeID) {
	
					this.__eliminarDetector(id);						

					cumplida(mensaje);

					return true;

				}

				return false;
			})
		})
	}

	// si se le pasa un callback va a ser recurrente
	// en caso contrario devuelve promise porque es de un solo uso
	esperarMensajesContenido(contenidos, callback = false){

		const cuerpo = this.__crearAnalizadorCuerpoMensaje(contenidos);

		const noRecurrente = callback == false;

		if(noRecurrente){

			return new Promise((cumplida, falla) => {

				const id = this.__crearDetector((mensaje) => {

					if(cuerpo(mensaje.Body)){

						this.__eliminarDetector(id);

						cumplida(mensaje);

						return true;
					}

					return false;
				})

			})

		}
		else{

			const id = this.__crearDetector((mensaje) => {

				if(cuerpo(mensaje.Body)){

					callback(mensaje, id);

					return true;

				}
				
				return false;

			})

		}
		

	}

	__agregarEnEspera(){


	}

	__bucle(){

		(async () => {

			while(!this.__salir){
		
				let mensajes = await this.__esperarMensajes();

				//console.log(mensajes)

				this.__procesarMensajes(mensajes);
				
			}

			this.__enSalida(this);

		})()

	}

	__esperarMensajes(){

		return this.sqs.getMensajes(this.qURL, {

			esperarPorXSegundos: 15, //un tiempo de 60 segundos

			esperarPor: ["ALL"]

		});


	}

	__procesarMensajes(mensajes){

		mensajes.forEach((m) => {

			m.Body = JSON.parse(m.Body);

			const dd = Object.values(this.__detectores);

			for(let i = 0; i < dd.length; i++){

				if(dd[i](m)){

					this.sqs.borrarMensaje(this.qURL, m.ReceiptHandle).then(() => {

						console.log("MENSAJE_BORRADO_COLA")
	
					})

					break;

				}

			}

		})

	}
	
	__crearDetector(codigo){

		const id = `detector_${this.__nDetector++}`;

		this.__detectores[id] = codigo;

		return id;
	}

	__eliminarDetector(id){

		delete this.__detectores[id];
	}

	__crearAnalizadorCuerpoMensaje(contenidos){

		return function(mensaje){

			return ComparadorMensajeContenido(mensaje, contenidos);			

		}
	}

}
