const fs = require("fs");
const path = require("path");

class Find{

    constructor(ruta, opciones = {}){
        this.ruta = ruta;
        this.incluirStats = opciones.incluirStats || false;
        this.rutaRelativa = opciones.rutaRelativa || false;
    }

    find(){
            
        return new Promise((cumplida, falla) => {

            try{
            
                this.__listarFicheros(

                    this.ruta, 

                    (entradas) => {
                        cumplida(
                            this.__formatearEntradas(entradas)
                        )
                    }
                )
            }
            catch(err){
                return falla(err);                
            }

        })

    }

    __listarFicheros(ruta, hecho, entradas = []){

        ruta = ruta || this.ruta;

        let totalEntradas = 0;

        let fCumplida = () => {

            if(--totalEntradas <= 0) hecho(entradas);
        };
        
        fs.readdir(ruta, (err, listaEntradas) => {

            if(err) throw err;

            totalEntradas = listaEntradas.length;

            listaEntradas.forEach((e) => {

                let rutaEntrada = path.join(ruta, e);
                
                fs.stat(path.join(ruta, e), (err, stats)=> {

                    if(stats.isDirectory()){

                        this.__listarFicheros(
                            rutaEntrada,
                            fCumplida,
                            entradas
                        )
                    }
                    else{

                        if(this.incluirStats){
                            entradas.push({
                                ruta: rutaEntrada,
                                stats
                            });
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

    __extraerRutaRelativa(ruta, rutaEntrada){

        return path.relative(ruta, rutaEntrada);
    }

    __formatearEntradas(entradas){

        let entradasFormateadas = [];

        if(this.rutaRelativa){

            entradasFormateadas = entradas.map((e) => {

                if(typeof(e) == "object"){

                    e.ruta = this.__extraerRutaRelativa(
                        this.ruta,
                        e.ruta
                    );

                    return e;
                }
                else{
                    return this.__extraerRutaRelativa(
                        this.ruta,
                        e
                    );
                }
            })            

        }
        else{
            return entradasFormateadas = entradas;
        }

        return entradasFormateadas;
        
    }

}

module.exports = Find;
