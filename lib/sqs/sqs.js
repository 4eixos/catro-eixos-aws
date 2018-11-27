const ReceptorSQS = require("./receptor.js");

const ColaSQS = require("./cola.js");

class SQS {

    constructor(aws){

        this.aws = aws;
		this.sqs = new this.aws.SQS();
    }

	crearReceptor(qURL){

		return new ReceptorSQS(

			this,

			qURL

		).iniciar()

	}

	crearCola(nombre, args = {}){


		//if(args.esFifo)
		//	nombre += ".fifo";

		const params = {

			QueueName: nombre,

			Attributes: {

			}

		}

		return new Promise((cumplida, falla) => {

			this.sqs.createQueue(params, function(err, data){

				if(err) return falla(err);

				else	return cumplida({

					url: data.QueueUrl

				});

			});

		})

	}

	receptorCola(){
		
		return new ColaSQS(this);
	}

	borrarCola(url, args = {}){

		return new Promise((cumplida, falla) => {

			this.sqs.deleteQueue({

				QueueUrl: url

			}, function(err, data){

				if(err)	return falla(err);

				else	return cumplida(data);

			})

		})

	}

    enviarMensajeFifo(url, mensaje, grupo_id, deduplicacion_id, atributos = {}){

        if(!grupo_id){

            throw `SQS: enviarMensajeFifo: falta el grupo id`

        }

        if(!deduplicacion_id){

            throw `SQS: enviarMensajeFifo: falta el id de deduplicacion`
        }

        return this.enviarMensaje(url, mensaje, atributos, {

            MessageGroupId: grupo_id,

            MessageDeduplicationId: deduplicacion_id

        });

    }

	enviarMensaje(url, mensaje, atributos = {}, adicionales = {}){

		mensaje = JSON.stringify(mensaje);

		let MessageAttributes = this.__calcularAtributos(atributos);

		const params = {

			MessageAttributes,

			MessageBody: mensaje,

			QueueUrl: url,

            ...adicionales

		}

        console.log(JSON.stringify(params, null, 4))

		return new Promise((cumplida, falla) => {

			this.sqs.sendMessage(params, function(err, data){

				if(err)	return falla(err);

				else	return cumplida(data);
			});

		})

	}

		__calcularAtributos(atributos){

			const r = {};

			Object.keys(atributos).forEach((k) => {

				let salida = {};
				let v = atributos[k];

				//determinamos tipo
				if(Number.isNumber(k)){
					salida["DataType"] = "Number";
					salida["StringValue"] = v.toString();
				}
				else if(typeof v === "String"){
					salida["DataType"] = "String";
					salida["StringValue"] = v;
				}
				else{
					salida["DataType"] = "Binary";
					salida["BinaryValue"] = v;
				}

				r[k] = salida;
			})

			return r;
		}

	getMensajes(qURL, args = {}){

		const params = {

			QueueUrl: qURL,

			AttributeNames: args.esperarPor || ["ALL"],

			MaxNumberOfMessages: 5,

			WaitTimeSeconds: args.esperarPorXSegundos

		}

		return new Promise((cumplida, falla) => {

			this.sqs.receiveMessage(params, function(err, data){

				if(err) return falla(err);

				else	return cumplida(data.Messages || [])

			})

		})
	}

	borrarMensaje(qURL, receiptHandle){

		return new Promise((cumplida, falla) => {

			this.sqs.deleteMessage({

				QueueUrl: qURL,

				ReceiptHandle: receiptHandle


			}, function(err, data){

				if(err)	return falla(err);

				else	return cumplida(data);
			})

		})

	}
}

module.exports = SQS;
