"use strict";

class S3 {

    constructor(aws){

        this.aws = aws;
        this.s3 = new this.aws.S3();

    }

    crearBucket(bucket, hecho){

        
    }

    listarBuckets(){

        return new Promise(function(cumplida, falla){

            this.s3.listBuckets(function(err, datos){

                 if(err){
                    falla(err);
                }
                else{
                    cumplida(datos)
                }

            });

        }.bind(this));
    }

    listarContenidoBucket(bucket, opciones = {}){

        var parametros = {
            Bucket: bucket, /* required */
            /*Delimiter: 'STRING_VALUE',
            EncodingType: url,
            Marker: 'STRING_VALUE',
            MaxKeys: 0,
            Prefix: 'STRING_VALUE',
            RequestPayer: requester*/
        };

        if(opciones.directorio && !opciones.directorio.match(/\/$/)){
            opciones.directorio += "/";
        }

        if(opciones.directorio) parametros["Prefix"] = opciones.directorio;
        if(opciones.delimitador) parametros["Delimiter"] = opciones.delimitador;

        if(opciones.limite) parametros["MaxKeys"] = opciones.limite;
        if(opciones.continuacion) parametros["ContinuationToken"] = opciones.continuacion;

        return new Promise(function(cumplida, falla){

            this.s3.listObjectsV2(parametros, function(err, datos){

                if(err) return falla(err);
                else    return cumplida(datos);
            })
        
        }.bind(this))
    }

    listarDirectoriosBucket(bucket, directorio = "/"){

        var parametros = {

            Bucket: bucket,
            Prefix: directorio,
            MaxKeys: 0,
            Delimiter: "/",
            FetchOwner: false
        }

        return new Promise(function(cumplida, falla){

            this.s3.listObjectsV2(parametros, function(err, datos){

                if(err) return falla(err);
                else    return cumplida(datos.CommonPrefixes);
            })

        }).bind(this);
        
    }

    descargarObjetoDeBucket(bucket, id){

        var parametros = {
            Bucket: bucket,
            Key: id
        };

        return new Promise(function(cumplida, falla){

            this.s3.getObject(parametros, function(err, datos){

                if(err) falla(err);
                else    cumplida(datos);

            });

        }.bind(this))
    }

    subirObjeto(bucket, id, datos, tipo){

        var parametros = {
            Bucket: bucket, 
            Key: id,
            Body: datos,
            ContentType: tipo
        };

        return new Promise((cumplida, falla) => {

            this.s3.putObject(parametros, (err, data) => {

                if(err) return falla(err);

                else cumplida(data);

            })

        })
    }

    borrarObjetoBucket(bucket, id){

        var parametros = {
            Bucket: bucket,
            Key: id
        };

        return new Promise((cumplida, falla) => {

            this.s3.deleteObject(parametros, (err, datos) => {

                if(err) return falla(err);

                else cumplida(datos);

            })

        });
    }

    borrarObjetosBucket(bucket, lista){

      let aBorrar = lista.map((e) => {
        return { Key: e.Key}
      })

      var parametros = {
        Bucket: bucket,
        Delete: {
          Objects: aBorrar
        }
      }

      return new Promise((cumplida, falla) => {

        this.s3.deleteObjects(parametros, (err, datos) => {

          if(err) return falla(err);

          else cumplida(datos);
        })

      });
    }

    hacerPublicoObjeto(bucket, id){

        return this.cambiarACLObjeto(bucket, id, "public-read");

    }

    hacerPrivadoObjeto(bucket, id){
    
        return this.cambiarACLObjeto(bucket, id, "private");

    }
    
    cambiarACLObjeto(bucket, id, acl){

        let parametros = {

            Bucket: bucket,

            Key: id,

            ACL: acl

        };

        return new Promise((cumplida, falla) => {

            this.s3.putObjectAcl(parametros, (err, datos) => {

                if(err) return falla(err);

                else    return cumplida(datos);
            })

        })
    }

    buscarObjeto(bucket, id){

        var parametros = {
            Bucket : bucket,
            Key: id
    
        };

        return new Promise((cumplida, falla) => {
        
            this.s3.headObject(parametros, (err, data) => {

                if(err) return falla(err);
        
                else return cumplida(data);
            })
        });
    }

    getAclObjeto(bucket, id){

        var parametros = {
            Bucket: bucket,
            Key: id
        };

        return new Promise((cumplida, falla) => {

            this.s3.getObjectAcl(parametros, (err, acl) => {

                if(err) return falla(err);

                else    return cumplida(acl);

            })


        })
    }

}

module.exports = S3;
