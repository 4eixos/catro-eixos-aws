"use strict";

const PlanificadorDescarga = require("./planificador_descarga.js");

const DESCARGAS_SIMULTANEAS = 2;

const S3 = require("./s3.js");

class S3Descarga extends S3{

    constructor(aws){

        super(aws);

        this.planificador = undefined;

        this.enFicheroPreparado = function(){};
        this.enParteDescargando = function(){};
        this.enParteDescargada =  function(){};
        this.enFicheroDescargado = function(){};
        
    }

    descargarFichero(bucket, id, fichero){

        var _self = this;

        return new Promise((cumplida, falla) => {

            this.buscarObjeto(bucket, id)
    
                .then((datos) => {

                    this.planificador = new PlanificadorDescarga(
                        fichero,

                        datos.ContentLength

                    );

                    this.planificador.planificar();

                    this.enFicheroPreparado(this.planificador);

                    //bucle principal
                    let bucle = (err) => {

                        if(err) return falla(err);

                        if(this.planificador.quedanPartes()){
                            this.__descargarPartes(bucket, id, bucle);
                        }

                        else{

                            this.enFicheroDescargado(this.planificador);

                            this.planificador.terminar(

                                (err) => {

                                  if(err) falla(`Cerrado de fichero ${err}`)

                                  else cumplida(datos);
                                }
                            );

                        }

                    };
         
                    bucle();           
                })

                .catch((err) => {

                    if(this.planificador){

                      this.planificador.terminar(() => {

                      });

                    }
            
                    falla(err);

                })

        })

    }
        
    __descargarPartes(bucket, id, callback){

        let partes = this.planificador.getPartesPendientes(
            DESCARGAS_SIMULTANEAS
        );

        let descargas = partes.map((p) => {

            return this.__descargarParte(
    
                bucket,
                id,
                p
            );
        });

        return Promise.all(descargas).then((partes) => {

            this.__escribirPartes(partes, callback);


        }).catch((err) => {

            callback(err);

        });
        
    }

    __escribirPartes(partes, callback){

        let partesOrdenadas = partes.sort((a, b) => {
            if(a.numero > b.numero)       return 1;
            else if(a.numero < b.numero)  return -1;
            else                          return 0;
        });

        let parteTrabajo;

        let bucle = (err) => {

            if(err) return callback(err);

            if(parteTrabajo) {
                parteTrabajo.terminada();
            }

            parteTrabajo = partesOrdenadas.shift();

   
            if(parteTrabajo){

                parteTrabajo.escribir((err) => {

                    this.enParteDescargada(parteTrabajo);

                    bucle(err);
                    
                })
            }
            else{
                callback(undefined);
            }
        };

        bucle();
    }

    __descargarParte(bucket, id, parte){
        
        parte.descargando();

        this.enParteDescargando(parte);

        var parametros = {
            
            Bucket: bucket,

            Key: id,

            Range: "bytes=" + parte.desde + "-" + parte.hasta,

        };

       return new Promise((cumplida, falla) => {

               this.s3.getObject(parametros, (err, d) => {

                   if(err) return falla(err);

                   parte.buffer = d.Body;

                   cumplida(parte);
               })

       });
        

    }
}

module.exports = S3Descarga;
