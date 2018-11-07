const uuid = require("uuid/v4");

module.exports = class {

	constructor(aws){

		this.aws = aws;
		this.cw = new this.aws.CloudWatch();
	}

	listarMetricas(namespace){

		const params = {

			Namespace: namespace

		}

		return new Promise((cumplida, falla) => {
		
			this.cw.listMetrics(params, function(err, data){
			
				if(err) return falla(`CW: listarMetricas: ${err} ${err.stack}`);

				else return cumplida(data);
			
			})
		
		})

	}

	getMetrica({
	
		id = "m" + uuid().replace(new RegExp(/\-/, "g"), "_"),

		desde = -60,

		hasta = Math.round(new Date() / 1000),

		nombre,

		namespace,

		periodo = 60,

		stat = "SampleCount",

		dimension,

		valor
	
	}){

		if(desde < 0){
			desde = hasta + desde;
		}

		console.log(`${desde} ${hasta}`)


		const params = {

			EndTime: hasta,

			MetricDataQueries: [{
			
				Id: id,

				MetricStat: {

					Metric: {
					
						Dimensions: [],

						//Dimensions: [{
						//

						//	Name: dimension,

						//	Value: valor
						//
						//}],

						MetricName: nombre,
						Namespace: namespace,

					},


					Stat: stat,
					Period: periodo,
					Unit: "None",

				},

				ReturnData: true
			
			}],

			StartTime: desde

		}

		return new Promise((cumplida, falla) => {
	
			this.cw.getMetricData(params, function(err, data){
			
				if(err) return falla(`CW: getMetrica: ${err} ${err.stack}`)
				
				else	return cumplida(data);
			
			})
		
		})
	}
}
