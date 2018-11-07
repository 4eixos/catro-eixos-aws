const S3 = require("./s3");

const path = require("path");

const GRANULARIDAD = 100;

class S3Movedor extends S3{

    listarParaMover(bucket, ruta){

       

    }

    moverADestino(bucketOrigen, bucketDestino, keyOrigen, keyDestino){

        let movidos;

        return this.copiarADestino(bucketOrigen, bucketDestino, keyOrigen, keyDestino)

            .then((copiados) => {

                movidos = copiados;

                return this.listarContenidoBucket(

                    bucketOrigen,
                    {
                        directorio: keyOrigen
                    }       
    
                )
            })

            .then((entradas) =>{

                let promesas = entradas.Contents.map((e) => {

                    return this.borrarObjetoBucket(bucketOrigen, e.Key)

                })

                return Promise.all(promesas);

            })
            .then(() => {

                return movidos.map((m) => {
                    return m["CopyObjectResult"]["ETag"];
                })

            })

    }

    copiarADestino(bucketOrigen, bucketDestino, keyOrigen, keyDestino){

        return this.listarContenidoBucket(

            bucketOrigen,

            {
                directorio: keyOrigen
            }

        )
        .then((entradas) => {

            return this.__moverObjetos(
                bucketOrigen,
                bucketDestino,
                keyOrigen,
                keyDestino,
                entradas.Contents
            );

        })

    }

    __moverObjetos(bucketOrigen, bucketDestino, keyOrigen, keyDestino, entradas){

        let promesas = entradas.map((entrada) => {

            return this.__moverObjeto(

                bucketOrigen,
                bucketDestino,
                entrada.Key,
                keyDestino + "/" + this.__extraerNombreObjeto(keyOrigen, entrada.Key)

            )

        });

        return Promise.all(promesas);
    }

    __moverObjeto(bucketOrigen, bucketDestino, keyOrigen, keyDestino){

        console.log(`Moviendo ${bucketOrigen} a ${bucketDestino} con ${keyOrigen} a ${keyDestino}`);

        let parametros = {

            Bucket: bucketDestino,
            CopySource: bucketOrigen + "/" + keyOrigen,
            Key: keyDestino
        }
        
        return new Promise((cumplida, falla) => {

            this.s3.copyObject(parametros, (err, data) => {

                if(err) return falla(err);
                else    return cumplida(data);

            })

        })
    }

    __extraerNombreObjeto(keyOrigen, nombreObjeto){

        let flagEsDirectorio = false;

        if(nombreObjeto.match(/\/$/)) flagEsDirectorio = true;

        nombreObjeto = nombreObjeto.replace(/\/$/, "");

        if(keyOrigen === nombreObjeto) return "";

        let ruta = path.relative(keyOrigen, nombreObjeto);
  
        if(flagEsDirectorio && !ruta.match(/\/$/)) 
          ruta += "/";

        return ruta;
    }

}

module.exports = S3Movedor;
