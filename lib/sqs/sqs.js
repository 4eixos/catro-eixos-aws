const ReceptorSQS = require("./receptor.js");

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

	enviarMensaje(url, mensaje, args = {}){

		mensaje = JSON.stringify(mensaje);

		const params = {

			MessageBody: mensaje,

			QueueUrl: url,

		}

		return new Promise((cumplida, falla) => {

			this.sqs.sendMessage(params, function(err, data){

				if(err)	return falla(err);

				else	return cumplida(data);
			});

		})

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
