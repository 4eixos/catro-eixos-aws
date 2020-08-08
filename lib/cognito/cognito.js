const JWT = require("jsonwebtoken")
const JWK = require("jwk-to-pem");


module.exports = class {

    constructor(aws){

        this.aws = aws;

        this.cognito = new this.aws.CognitoIdentityServiceProvider({
              apiVersion: "2016-04-19",
        })
    }

    cambiarPassword(usuario, poolId, nuevaPassword){

        const params = {
        
            Password: nuevaPassword,

            UserPoolId: poolId,

            Username: usuario,

            Permanent: true
        
        }

        return new Promise((cumplida, falla) => {
        
            this.cognito.adminSetUserPassword(params, function(error, data){
            
                if(error) return falla(error)

                return cumplida(data)
            })
        
        })
    }

    crearUsuario({usuario, poolId, atributos = [], password}){

        const poolData = {

            UserPoolId: poolId,

            Username: usuario,

            TemporaryPassword: password,

            UserAttributes: atributos,

            MessageAction: "SUPPRESS"

        }

        return new Promise((cumplida, falla) => {

            this.cognito.adminCreateUser(poolData, (err, data) => {
        
                if(err)
                    return falla(err)
                else
                    cumplida(data)
            })

        })

    }

    jwtValidar(jwt, jwk, adicionales = {}){

       const partes = jwt.split(/\./);

        if(partes.length != 3){

            throw `JWT_FORMATO_INCORRECTO`

        }

        const cabecera = Buffer.from(partes[0], 'base64').toString('ascii');

        const carga = Buffer.from(partes[1], 'base64').toString('ascii');

        const datos = {}

        let token;

        try{

            datos.cabecera = JSON.parse(cabecera);

            datos.carga = JSON.parse(carga);

            //buscamos la firma
            const k = jwk.keys.filter(key => key.kid === datos.cabecera.kid)[0]

            if(!k){
                throw `KID no encontrada`
            }       

            //comprobamos la carga
            const pem = JWK(k);                       

            JWT.verify(jwt, pem, { algorithms: ['RS256']}, function(err, decTok){

                if(err) throw err;

                token = decTok;

            });

            //comprobamos que el tiempo es correcto
            const tiempo = Math.floor(Date.now() / 1000)

            if(token.exp < tiempo){
                throw `TOKEN CADUCADO`
            }

            //comprobaciones adicionales
            if(adicionales){

                if(adicionales.iss && token.iss !== adicionales.iss)
                    throw `ISS_INCORRECTO`

                if(adicionales.token_use && token.token_use !== adicionales.token_use)
                    throw `TOKEN_USE_INCORRECTO`
            }

            
        }       
        catch(e){

            throw e;

        }

        return token;
    }

}


