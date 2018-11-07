"use strict";

const fs = require("fs");

const CHUNK = 1024 * 1024 * 15;

class Troceador{
    
    constructor(fichero){

        this.fichero = fichero;
        this.buffer = undefined;
        this.tamTotal = undefined;
        this.starTime = new Date();     
        this.partesInfo = [];
        this.parteActual = 0;
        this.fd = false;

    }
    
    prepararFichero(){

        return new Promise((cumplida, falla) => {

            //fs.readFile(this.fichero, function(err, datos){
            fs.stat(this.fichero, (err, datos) => {

                if(err){
                    falla(err);
                }
                else{
                    //this.buffer = datos;
                    this.tamTotal = datos.size;

                    this.__prepararPartes();

                    cumplida(this);

                }

            })
        })
    }

    __prepararPartes(){
                    
        this.numeroPartes = Math.ceil(this.tamTotal / CHUNK);

        for(let i = 0; i < this.numeroPartes; i++){

            let desde = i * CHUNK;
            let hasta = Math.min((i+1) * CHUNK, this.tamTotal);

            this.partesInfo.push(

                new Parte(

                    i,

                    desde,

                    hasta,

                    this.fichero

                )
            
            );
        }
    }
    
    getSiguienteParte(){

        return this.partesInfo.filter(function(parte){

            return parte.disponible() //&& parte.preparar(this.buffer)

        }.bind(this))[0] || false;
    }

    getPendientes(){

        var pendientes = 0;

        this.partesInfo.filter(function(p){

            if(p.disponible()) pendientes++;
        });
        
        return pendientes;
    }
}

class Parte {

    constructor(numero, desde, hasta, fichero){

        this.estado = "DISPONIBLE";
        this.numero = numero;
        this.desde = desde;
        this.hasta = hasta;
        this.buffer = undefined;
        this.fichero = fichero;
    }

    raw(){
        return {
            estado: this.estado,
            numero: this.numero,
            tam: this.buffer.length,
        };
    }

    preparar(callback){

        fs.open(this.fichero, "r", (err, fd) => {

            if(err) return callback(err, this);

            this.fd = fd;

            this.buffer = new Buffer(this.hasta - this.desde);

            console.log("Leyendo ", this.buffer.length);

            fs.read(this.fd, 
                    this.buffer, 
                    0, 
                    this.hasta - this.desde, 
                    this.desde, 

                    (err, bLeidos, buffer) => {

                        this.buffer = buffer;

                        fs.close(this.fd, () => {
                
                          callback(err, this);

                        })
    
                    }
            );
            
        });
            //this.buffer = buffer.slice(this.desde, this.hasta);

    }

    disponible(){
        return this.estado == 'DISPONIBLE' || this.estado == "FALLIDA";
    }

    subiendo(){
        this.estado = "SUBIENDO";
    }
    
    subida(){
        this.estado = "SUBIDA";
        this.buffer = undefined;
    }
}

module.exports = Troceador;

//new Troceador("./data/entrada/original.mp4").prepararFichero().then(function(t){
//
//    var parte;
//
//    while(parte = t.getSiguienteParte()){
//
//        parte.subiendo();
//
//        console.log(parte);
//    }
//
//});

