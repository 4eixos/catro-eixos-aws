"use strict";

const AWS = require("aws-sdk");

const MiS3 = require("./lib/s3/s3.js");
const MiS3Multi = require("./lib/s3/s3multi.js");
const MiS3Descarga = require("./lib/s3/s3descarga.js");
const MiS3Permisos = require("./lib/s3/s3permisos.js");
const MiS3Arbol = require("./lib/s3/s3arbol.js");
const MiS3Movedor = require("./lib/s3/s3movedor.js");
const MiS3Movedor2 = require("./lib/s3/s3movedor2.js");
const MiRoute53 = require("./lib/route53/route53.js");
const MiSQS = require("./lib/sqs/sqs.js");

const MiCF = require("./lib/cf/cf.js");

const MiLambda = require("./lib/lambda/lambda.js");

const MiCW = require("./lib/cw/cw.js");

const MiIotData = require("./lib/iot_data/iot_data.js");

const MiDynamoDB = require("./lib/dynamodb/dynamodb.js");

const MiCognito = require("./lib/cognito/cognito.js");

let AWS_INICIADO = false;

let credenciales = false;

module.exports = {

    setCredenciales: (region, accessKeyId, secretAccessKey)=>{

        credenciales = {region, accessKeyId, secretAccessKey};

    },

	Lambda: function(sin_credenciales = false){

		if(!sin_credenciales) iniciar_aws();

		return new MiLambda(AWS);
	},

    S3 : function(){
        iniciar_aws();
        return new MiS3(AWS)
    },

    S3Multi : function(){
        iniciar_aws();
        return new MiS3Multi(AWS);
    },

    S3Descarga: function(){
        iniciar_aws();
        return new MiS3Descarga(AWS);
    },

    S3Permisos: function(){
        iniciar_aws();
        return new MiS3Permisos(AWS);
    },

    S3Arbol: function(){
        iniciar_aws();
        return new MiS3Arbol(AWS);
    },

    S3Movedor: function(){
        iniciar_aws();
        return new MiS3Movedor2(AWS);
    },

	CloudWatch(){
		iniciar_aws();
		return new MiCW(AWS);
	},

    CloudFront: function(){
        iniciar_aws();
        return new MiCF(AWS);
    },

	IotData: function(extremo){
		iniciar_aws();
		return new MiIotData(AWS, extremo);

	},
	Route53: function(){
		iniciar_aws();
		return new MiRoute53(AWS);
	},

	SQS: function(){
		iniciar_aws();
		return new MiSQS(AWS);
	},

	DynamoDB: function(){
            iniciar_aws();
            return new MiDynamoDB(AWS);
    },

    Cognito: function(){

 //       iniciar_aws();

        return new MiCognito(AWS);
    },

    iniciar: function(){

        iniciar_aws();
    }
};

function iniciar_aws(){

    if(AWS_INICIADO) return;

    if(!credenciales) throw "Credenciales no seteadas (has llamado a setCredenciales?)"

    AWS.config.update(credenciales);
 
    AWS_INICIADO = true;   
}
