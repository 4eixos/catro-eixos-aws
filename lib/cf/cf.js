"use strict";

class cf {

    constructor(aws){

        this.aws = aws;
        this.cf = new this.aws.CloudFront();

    }

    getDistribucion(idDistribucion){

      let parametros = {
        Id: idDistribucion
      };

      return new Promise((cumplida, falla) => {

        return this.cf.getDistribution(parametros, (err, data) => {

          if(err) falla(err);

          else    cumplida(data);
        })

      })
    }

    invalidar(idDistribucion, paths){

      let ref = this.__encargarReferencia();

      return this.__encargarInvalidacion(ref, idDistribucion, paths)

          .then((invalidacion) => {

              return this.__esperarPor(invalidacion.Id, idDistribucion, 'invalidationCompleted')

          })
    }

    __encargarInvalidacion(ref, idDistribucion, paths){

      let parametros = {

        DistributionId: idDistribucion,

        InvalidationBatch: {

          CallerReference: ref,

          Paths: {

            Quantity: paths.length,

            Items: paths

          }
        }

      };

      return new Promise((cumplida, falla) => {
        
        this.cf.createInvalidation(parametros, (err, datos) => {

          if(err) falla(err);

          else    cumplida(datos.Invalidation);

        })

      })
    }

    __esperarPor(id, idDistribucion, tipo){

      let parametros = {
        DistributionId: idDistribucion,
        Id: id
      };

      return new Promise((cumplida, falla) => {

        this.cf.waitFor(tipo, parametros, (err, data) => {

          if(err) falla(new Error(err));

          else    cumplida(data);

        })

      })

    }


    __encargarReferencia(){

      return Math.floor(Date.now()).toString();

    }
}

module.exports = cf;
