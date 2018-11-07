"use strict";

module.exports = class {

	constructor(aws){

		this.aws = aws;
		this.lambda = new aws.Lambda({
			
		});
	}

	/*
	 * lambda: nombre de la funcion (obligatorio)
	 * payload: parametros a pasar (obligatorio)
	 * opcs: objeto
	 *		version: Versión de la lambda a ejecutar
	 *		modo: modo de ejecución
	 *			- RequestResponse
	 *			- Event
	 *			- DryRun
	 *
	 *
	 *
	 */
	invocar(lambda, payload, opcs = {}){

		const params = {
		
			FunctionName: lambda,
			Payload: JSON.stringify(payload, null, 2)
		
		};

		if(opcs.version){
			params.Qualifier = opcs.version;
		}

		if(opcs.modo){
			params.InvocationType = opcs.modo;
		}

		return new Promise((cumplida, falla) => {
		
				this.lambda.invoke(params, (err, data) => {
				
					if(err) return falla(err);

					else 	return cumplida(this.__prepararRespuesta(data.Payload));
				
				})
		
		})

	}

	invocarAsync(lambda, payload){

		const params = {

			FunctionName: lambda,
			InvokeArgs: JSON.stringify(payload, null, 2)

		}

		return new Promise((cumplida, falla) => {
		
			this.lambda.invokeAsync(params, (error, data) => {
			
				if(error) return falla(`invokeAsync: ${err} ${err.stack}`)

				else	return cumplida(this.__prepararRespuesta(data));
			
			})
		
		})
	}

	__prepararRespuesta(payload){

		return new class {

			constructor(payload){

				this.payload = payload

			}

			raw(){

				return Promise.resolve(this.payload);

			}

			json(){
				return Promise.resolve(JSON.parse(this.payload))
			}


		}(payload)

	}
}
