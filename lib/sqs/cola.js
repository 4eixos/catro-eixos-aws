module.exports = class {

	constructor(sqs){

		this.sqs = sqs;
		this.qURL = "";
		this.__terminar = false;
	}

	recibir(qURL, atributos = { esperarPor: ["ALL"]}){

		const _self = this;

		_self.qURL = qURL;

		return async function* () {

			while(!_self.__terminar){

				const mensajes = await _self.__getMensajes(qURL, atributos);

				if(_self.__terminar) return;

				for(let i = 0; i < mensajes.length; i++) yield {

					cuerpo: JSON.parse(mensajes[0].Body),

					...mensajes[0]

				};
			}		


		};

	}

	terminar(){

		this.__terminar = true;
	}

	mensajeProcesado({ReceiptHandle}){

		return this.sqs.borrarMensaje(this.qURL, ReceiptHandle);

	}

	__getMensajes(qURL, atributos){

		atributos.esperarPorXSegundos = 15;

		return this.sqs.getMensajes(qURL, atributos);
	}

}
