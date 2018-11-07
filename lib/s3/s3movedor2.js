const S3 = require("./s3");

const path = require("path");

const GRANULARIDAD = 100;

class S3Movedor extends S3{

  constructor(aws){
    super(aws);

    this.enListaPreparada = () => {}; //aprox 20% del tiempo
    this.enCopiaDeObjetos = () => {};
    this.enCopiaFinalizada = () => {};
    this.enBorradoDeObjetos = () => {};
    this.enBorradoFinalizado = () => {};
  }

  borrarDeOrigen(bucketOrigen, keyOrigen){

    let ee;
    
    return this.__listarElementos(bucketOrigen, keyOrigen)

      .then((elementos) => {

        ee = elementos;
  
        this.enListaPreparada(ee);

      })

      .then(() => {

        return this.__borrarElementos(
      
          bucketOrigen,

          ee
        )

      })

      .catch((err) => {

        throw new Error(err);

      })
  }

  moverADestino(bucketOrigen, bucketDestino, keyOrigen, keyDestino){

    let ee;

    return this.__listarElementos(bucketOrigen, keyOrigen)

      .then((elementos) => {

        ee = elementos;

        this.enListaPreparada(ee);

      })

      .then(() => {

        return this.__copiarElementos(

          bucketOrigen,
          bucketDestino,
          keyOrigen,
          keyDestino,
          ee
        );

      })

      .then(() => {

        return this.__borrarElementos(
      
          bucketOrigen,

          ee
        )

      })

      .catch((err) => {

        throw new Error(err);

      })
  }

  __listarElementos(bucketOrigen, rutaOrigen){

    return (async () => {
      
      let entradas = [];

      let datos = await this.listarContenidoBucket(

        bucketOrigen,

        {
          directorio: rutaOrigen,

          limite: 900
        }

      );
      
      while(datos.IsTruncated){

        entradas = entradas.concat(datos.Contents);

        datos = await this.listarContenidoBucket(

          bucketOrigen,

          {
            directorio: rutaOrigen,

            limite: 900,

            continuacion: datos.NextContinuationToken
          }

        )

      }
      
      if(datos.Contents.length > 0)
        entradas = entradas.concat(datos.Contents);

      return entradas;

    })()

  }

  __copiarElementos(

      bucketOrigen, 
      bucketDestino, 
      rutaOrigen, 
      rutaDestino, 
      elementos)
  {

      return this.__bucle((ee) => {

        let promesas = ee.map((entrada) => {

          return this.__moverObjeto(

            bucketOrigen,

            bucketDestino,

            entrada.Key,

            rutaDestino + "/" + this.__extraerNombreObjeto(

              rutaOrigen,

              entrada.Key

            )
          )
            .catch((err) => {
              throw new Error(err + " "  + " Key: " + entrada.Key);
            })

        })

        return Promise.all(promesas).then(() => {
  
          this.enCopiaDeObjetos(ee);

        })

      }, elementos)

        .then(() => {

          this.enCopiaFinalizada();

        })
    

  }


  __borrarElementos(bucketOrigen, elementos){

    return this.__bucle((ee) => {

      return this.borrarObjetosBucket(bucketOrigen, ee)

        .then(() => {

          return this.enBorradoDeObjetos(ee);

        })

    }, elementos)

      .then(() => {

        return this.enBorradoFinalizado();

      })

  }

  __bucle(aplicar, elementos, granularidad = GRANULARIDAD){

    return (async () => {

      let continuar = true;

      let i = 0;

      while(continuar){

        let parteElementos = elementos.slice(i, i + granularidad)

        await aplicar(parteElementos);

        i += granularidad;

        if(i >= elementos.length) 
          continuar = false;

      }
    
    })()
  }

  __moverObjeto(bucketOrigen, bucketDestino, keyOrigen, keyDestino){

    //console.log(`Moviendo ${bucketOrigen} a ${bucketDestino} con ${keyOrigen} a ${keyDestino}`);

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
