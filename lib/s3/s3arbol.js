"use strict";

const fs = require("fs");
const S3Multi = require("./s3multi.js");
const S3 = require("./s3.js");
const path = require("path");

const SUBIDAS_SIMULTANEAS = 3;

class S3Arbol extends S3Multi{

    constructor(aws){

        super(aws);

        this.enComienzoDeSubida = () => {};
        this.enSubidaDeObjeto = () => {};
        this.enModificacionDeObjeto = () => {};
        this.enObjetoSubido = () => {};
        this.enSubida = () => {};

        this.SUBIDAS_SIMULTANEAS = SUBIDAS_SIMULTANEAS; 
       
    }

    set subidasSimultaneas(numero){

      if(!Number.isInteger(numero) || numero < 1){
        throw new Error("subidasSimultaneas tiene que ser un número entero > 0");
      } 

      this.SUBIDAS_SIMULTANEAS = numero;

    }

    subirArbolFicheros(bucket, id, ruta){

        this.ruta = ruta;

        let terminar = false;

        return new Promise((cumplida, falla) => {

            this.__getListaFicheros(ruta, (lista) => {

                console.log(lista);

                this.enComienzoDeSubida(lista);

                let subidas = [];

                for(let i = 0; i < lista.length;){

                    let parteLista = lista.slice(i, i + this.SUBIDAS_SIMULTANEAS);

                    subidas.push(() => {

                        return parteLista.map((e) => {

                            return new Promise((cumplida, falla) => {

                                this.__subirFichero(

                                    bucket,

                                    id + "/" + this.__extraerRutaBase(ruta, e),

                                    e

                                ).then(() => {
                                    cumplida();
                                }).catch((err) => {
                                    falla(err);
                                })
                            })
                        })
                    });

                    i += this.SUBIDAS_SIMULTANEAS;

                }

                //cumplida(subidas);            
                this.__bucle(subidas)

                    .then(() => {

                        this.enSubida();

                        cumplida(lista);
                    })
                    .catch((err) => {
                        falla(err);
                    })

            })

        });

    }

    __extraerRutaBase(ruta, rutaFichero){

        let predicado = rutaFichero.match(/\/$/) ? "/" : "";

        return path.relative(ruta, rutaFichero) + predicado;
    }

    __bucle(subidas){

        let f_bucle = (cumplida, falla) => {

            let tanda = subidas.shift();

            if(tanda){

                let promesas = tanda().map((p) => {

                    return p;

                });

                Promise.all(promesas)

                    .then(() => {
                        f_bucle(cumplida, falla);
                    })
                    .catch((err) => {
                        falla(err);
                    })
            }
            else{
                cumplida();
            }
        };

        return new Promise((cumplida, falla) => {

            f_bucle(cumplida, falla);

        })

    }

    __subirFichero(bucket, id, fichero){

        id = id.replace(/\/\//g, "/");

        return new Promise((cumplida, falla) => {

            this.enSubidaDeObjeto(id + "/" + fichero);

            let s3Multi = new S3Multi(this.aws)

            //eventos de s3Multi
            this.__configurarS3Multi(s3Multi);

            s3Multi.subirFichero(

                bucket,

                id,

                fichero

            ).then((c) => {

                this.enObjetoSubido(id + "/" + fichero);

                cumplida(c);

            })

        })

    }

    __getListaFicheros(ruta, hecho, entradas = []){

        console.log(`Para ruta ${ruta}`);

        ruta = ruta || this.ruta;

        if(ruta === this.ruta){
          entradas.push(this.ruta + "/");
        }


        let totalEntradas = 0;

        let fCumplida = () => {
            if(--totalEntradas <= 0) hecho(entradas); 
        };
    
        fs.readdir(ruta, (err, listaEntradas) => {

            if(err) throw new Error(err);
    
            totalEntradas = listaEntradas.length;

            if(totalEntradas === 0){
              return fCumplida();
            }   

            listaEntradas.forEach((e) => {

                let rutaEntrada = path.join(ruta, e);

                fs.stat(path.join(ruta, e), (err, stats) => {

                    if(stats.isDirectory()){

                        entradas.push(rutaEntrada + "/");

                        this.__getListaFicheros(

                            rutaEntrada,

                            () => {
                                fCumplida();
                            },

                            entradas
                        )

                    }
                    else{

                        if(stats.size === 0){

                            console.log(`omitiendo entrada ${rutaEntrada} por estar vacio`);

                        }
                        else{
                            entradas.push(rutaEntrada);
                        }

                        fCumplida();
                    }

                })

            })

        })

    }

    __configurarS3Multi(s3Multi, key){

        s3Multi.enFicheroPreparado(
        
            (troceador) => {                
        
                this.enModificacionDeObjeto(
        
                    "FICHERO_LEIDO",
        
                     key,
        
                    {
                        partes: troceador.numeroPartes,
        
                        tamTotal: troceador.tamTotal
                    }
                    
                );
            }
        );

        s3Multi.enSubiendoParte(

            (parte) => {

                this.enModificacionDeObjeto(

                    "PARTE_SUBIENDO",

                    key,

                    parte.raw()

                )

            }

        );

        s3Multi.enSubidaParte(

            (parte) => {

                this.enModificacionDeObjeto(

                    "PARTE_SUBIDA",
    
                    key,

                    parte.raw()

                );

            }

        );        

    }
}


module.exports = S3Arbol;
