module.exports = class {

	constructor(aws, extremo){

		this.aws = aws;
		this.iot = new aws.IotData({
		
			endpoint: extremo
		
		});
	}

	publicar(topic, payload){

		const params = {

			topic,

			payload: JSON.stringify(payload, null, 2),

			qos: 0

		}

		return new Promise((cumplida, falla) => {
		
			return this.iot.publish(params, function(err, data){
			
				if(err) return falla(`IotData: publicar: ${err} ${err.stack}`);
			
				else	return cumplida(data);
			})
		
		})

	}

	recogerShadow(cosa){

		const params = {

			thingName: cosa
		}

		return new Promise((cumplida, falla) => {
		
			return this.iot.getThingShadow(params, function(err, data){
			
				if(err) return falla(`IotData: recogerShadow: ${err} ${err.stack}`)

				else	return cumplida(JSON.parse(data.payload));
			})
		
		})

	}

	publicarShadow(cosa, sombra){

		const params = {

			thingName: cosa,
			payload: JSON.stringify(sombra, null, 2)

		}

		return new Promise((cumplida, falla) => {
		
			return this.iot.updateThingShadow(params, function(err, data){
			
				if(err) return falla(`IotData: publicarShadow: ${err} ${err.stack}`)
			
				else	return cumplida(JSON.parse(data.payload));
			})
		
		})

	}
	


}
