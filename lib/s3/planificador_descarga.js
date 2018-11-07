"use strict";

const fs = require("fs");

const CHUNK = 1024 * 1024; //bajamos en rangos de 1MB

const path = require("path");

class PlanificadorDescarga{

    constructor(fichero, size){

        this.fichero = fichero;
        this.tamTotal = size;
        this.numeroPartes = 0;
        this.partesInfo = [];
        this.fPrimeraParteEscrita = false;
        this.fd;
    }

    terminar(cb){

        if(!this.fd) return cb();

        fs.close(this.fd, function(err){

          if(err) cb(err);

          else    cb();
        });
    }

    planificar(){

        this.numeroPartes = Math.ceil(this.tamTotal / CHUNK);

        this.__crearDirectorio();

        this.fd = fs.openSync(this.fichero, "w");

        for(let i = 0; i < this.numeroPartes; i++){

            let desde = i * CHUNK;
            let hasta = Math.min((i+1) * CHUNK, this.tamTotal);

            this.partesInfo.push(

                new ParteDescarga(
                    
                    i,
                    
                    desde,

                    hasta,

                    this.fd

                )

            );
        }

    }

    __crearDirectorio(){

        let directorio = path.dirname(this.fichero);

        if(!fs.existsSync(directorio)){
            fs.mkdirSync(directorio);
        }
    }

    quedanPartes(){

        return this.partesInfo.filter((p) => {

            return p.pendiente()

        })[0];
    }

    getPartesPendientes(num){

        let partes = [];
        let cargadas  = 0;

        for(let i = 0; i < this.numeroPartes; i++){
        
            if(this.partesInfo[i].pendiente()){

                partes.push(this.partesInfo[i]);                

                cargadas++;

                if(cargadas >= num) break;

            }
                        
        }   
        return partes;
    }
}

class ParteDescarga{

    constructor(numero, desde, hasta, fd){

        this.numero = numero;
        this.desde = desde;
        this.hasta = hasta;
        this.fd = fd;
        this.buffer = undefined;
        this.estado = "ESPERANDO";
        this.rango = hasta - desde;
    }

    escribir(callback){

      try{

        fs.write(
            this.fd, 
            this.buffer, 
            0, 
            this.hasta - this.desde, 
            this.desde, 
            (err, escritos, buffer) => {

                if(err) return callback(err);

                this.buffer = undefined;

                callback(null, this);

            }

        )

      }
      catch(e){
        callback(`Error en escritura de parte ${this.numero}: ${e}`);
      }

    }

    terminada(){
        this.estado = "TERMINADA";
    }  
    
    descargando(){
        this.estado = "DESCARGANDO";
    }   

    descargado(){
        this.estado = "DESCARGADA";
    }
    
    pendiente(){
        return this.estado == "ESPERANDO";
    }   
}

module.exports = PlanificadorDescarga;
