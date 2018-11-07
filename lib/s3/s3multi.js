const Troceador = require("./troceador.js");

const SUBIDAS_SIMULTANEAS = 3;

class S3Multi{

    constructor(aws){

        this.aws = aws;
        this.s3 = new this.aws.S3();
        this.idMultiParte = false;
        this.enFicheroPreparado = function(){console.log("PREPARADO")};
        this.enSubiendoParte = function(){};
        this.enSubidaParte = function(){};
        this.enFicheroSubido = function(){};
    }

    subirFichero(bucket, id, fichero){

        console.log(`Subiendo ${fichero} a bucket ${bucket} con id ${id}`);

        var _self = this;

        var troceador = new Troceador(fichero);

        return new Promise(function(cumplida, falla){

            _self.__prepararSubidaMultiParte(bucket, id, fichero)

                .then(function(){

                    return troceador.prepararFichero()

                })

                .then(function(){

                    _self.enFicheroPreparado(troceador);

                    var _f_bucle = function(err, valores){

                        return _self.__realizarSubida(

                            bucket,

                            id,

                            troceador,

                            function(err, values){

                                if(err) return falla(err);

                                if(troceador.getPendientes() > 0){

                                    _f_bucle();

                                }
                                else{

                                    _self.__completarSubidaMultiParte(bucket, id, troceador)

                                        .then(function(){

                                            cumplida();

                                        });
                                }

                            }

                        )
                    }

                    _f_bucle();
                })
                .catch((err) => {
                    falla(err);
                })

        })

    }

    __completarSubidaMultiParte(bucket, id, troceador){

        var parametros = {

            Bucket: bucket,

            Key: id,

            UploadId: this.idMultiParte,

            MultipartUpload: {

                Parts: troceador.partesInfo.map(function(parte){

                    return {

                        ETag: parte.ETag,

                        PartNumber: parte.numero + 1
                    
                    }

                })

            }

        };

        return new Promise(function(cumplida, falla){

            this.s3.completeMultipartUpload(

                parametros,

                function(err, datos){

                    if(err) return falla(err);

                    this.enFicheroSubido(this);

                    return cumplida(datos);

                }.bind(this)

            );

        }.bind(this));

    }

    /*
     *  Sube una serie de partes hasta el limite de subidas simultáneas 
     */
    __realizarSubida(bucket, id, troceador, callback){

            var _self = this;

            var pendientes = Math.max(0, troceador.getPendientes());
            pendientes = Math.min(pendientes, SUBIDAS_SIMULTANEAS);

            if(pendientes > 0){

            var subidas = [];
    
            for(var i = 0; i < pendientes; i++){

                var parte = troceador.getSiguienteParte(); 
    
                parte.subiendo();

                _self.enSubiendoParte(parte);
                
                subidas.push(

                    _self.__subirFicheroParteABucket(

                        bucket,

                        id,

                        _self.idMultiParte,
        
                        parte

                    )
                );

            }       

            Promise.all(subidas).then(function(values){

                values.forEach(function(p){
                    p.subida();
                });

                callback();
            
            }).catch(function(err){

                callback(err);

            })

        }
        else{
            callback(undefined);
        }
    }

    /*
     * Prepara s3 para que se puedan ir subiendo partes
     */
    __prepararSubidaMultiParte(bucket, id, fichero){

        var parametros = {

            Bucket : bucket,

            Key: id,

            ContentType: this.__determinarTipoContenido(fichero),

            ContentDisposition: "inline",
        };

        console.log(parametros);

        return new Promise(function(cumplida, falla){

            this.s3.createMultipartUpload(parametros, function(err, datos){

                if(err) return falla(err);

                this.idMultiParte = datos.UploadId;
                
                return cumplida(datos);

            }.bind(this))

        }.bind(this));

    }
    
    __determinarTipoContenido(fichero){

        if(fichero.match(/\/$/)){
          return "application/x-directory";
        }

        var t = fichero.match(/\.(\w+)$/);

        let extension = t[1];

        if(!extension) return "text/plain";
        
        else if(extension === "m3u8") return "application/x-mpegURL";

        else if(extension === "ts") return "video/MP2T";

        else if(extension === "mpd") return "application/dash+xml";

        else return "video/" + t[1];
    }

    /*
     * Sube una parte al sistema
     */
    __subirFicheroParteABucket(bucket, id, idMultiParte, parte){

        var parametros = {

            Bucket: bucket,

            Key: id,    

            UploadId: idMultiParte,

            //Body: parte.buffer,

            PartNumber: parte.numero + 1

        };

        return new Promise(function(cumplida, falla){

            parte.preparar((err, parte) => {

                parametros.Body = parte.buffer;              

                console.log("Subiendo parte ", parte.buffer.length);  

                this.s3.uploadPart(parametros, (err, datos) => {

                    if(err){
                        falla(err);
                    }
                    else{

                        parte.ETag = datos.ETag;

                        this.enSubidaParte(parte);
    
                        cumplida(parte);
                    }

                });
            
            })
        }.bind(this))    
    
    }
}

module.exports = S3Multi;
