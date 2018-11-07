"use strict";

class Route53 {

    constructor(aws){

        this.aws = aws;
        this.r53 = new this.aws.Route53();

    }

	crearRegistroCNAMEZona(zonaID, {nombre, resuelve_a, TTL}){

		const params = this.__parametrosBase(zonaID);

		params.ChangeBatch.Changes.push({

			Action: "CREATE",
			ResourceRecordSet: {
			  Name: nombre,
			  Type: "CNAME",
			  //AliasTarget: {
			  //	DNSName: resuelve_a,
			  //	EvaluateTargetHealth: true,
			  //	HostedZoneId: zonaID

			  //},
			  ResourceRecords: [

			  	{ Value: resuelve_a}

			  ],
			  TTL: TTL,
			  SetIdentifier: nombre,
			  Weight: 0,

			}
		})

		return new Promise((cumplida, falla) => {

			this.r53.changeResourceRecordSets(params, function(err, data){

				if(err) return falla(err);

				else 	return cumplida(data);
			})

		})
	}

	borrarRegistroCNAMEZona(zonaID, {nombre, resuelve_a}){

		const params = this.__parametrosBase(zonaID);

		params.ChangeBatch.Changes.push({

			Action: "DELETE",
			ResourceRecordSet: {

				Name: nombre,	
				Type: "CNAME",
				ResourceRecordSet: [
					{value: resuelve_a}
				]

			}

		});

		return new Promise((cumplida, falla) => {

			this.r53.changeResourceRecordSets(params, function(err, data){

				if(err) return falla(err);

				else 	return cumplida(data);
			})
		
		})
	}

	__parametrosBase(zonaID){

		return {

			ChangeBatch: {

				Changes: [],

				Comment: ""

			},

			HostedZoneId: zonaID

		}

	}

}

module.exports = Route53;
