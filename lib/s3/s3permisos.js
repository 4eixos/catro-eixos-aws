"use strict";

const S3 = require("./s3.js");

const TODOS_LOS_USUARIOS = 'http://acs.amazonaws.com/groups/global/AllUsers';

class S3Permisos extends S3{

    objetoEsPublico(bucket, id){
     
        return Promise.resolve( 

            this.getAclObjeto(bucket,id)

        ).then((acl) => {
 
            return this.esAclPublica(acl);
        }) 
    }

    esAclPublica(acl){

        let acceso_publico = false;
        
        acl.Grants.forEach((g) =>{

            if(
                g.Grantee.Type == "Group" &&

                g.Grantee.URI == TODOS_LOS_USUARIOS
            ){
    
                acceso_publico = true;
            }

        });

        return acceso_publico;
    }

}

//Grantee: 
//     { Type: 'Group',
//       URI: 'http://acs.amazonaws.com/groups/global/AllUsers' },
//    Permission: 'READ' 
//
module.exports = S3Permisos;
