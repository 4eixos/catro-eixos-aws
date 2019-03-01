module.exports = class {

	constructor(aws){

		this.aws = aws;

		this.d = new this.aws.DynamoDB({apiVersion: '2012-08-10'});

	}

	/*
     *   nombre de tabla
     *   atributos: (objeto)
     *		- tipo: "S|N|B"
     *      - key: "HASH|RANGE"
	 *    r: numero de lecturas (defecto 0)
     *    w: numero de escrituras (defecto 0)
     */
	nuevaTabla(tabla, atributos = false, r = 0, w = 0){

		return new Promise((cumplida, falla) => {

			if(!atributos)
				return falla(`DynamoDB::nuevaTabla: atributos no es un objeto`);

			const {
				AttributeDefinitions,
				KeySchema,
			} = this.__prepararAtributos(atributos);			

			const params = {

				TableName: tabla,

				AttributeDefinitions,

				KeySchema,

				ProvisionedThroughput: {

					ReadCapacityUnits: r,
					WriteCapacityUnits: w
				}

			}

			this.d.createTable(params, function(err, data){

				if(err) falla(`DynamoDB:nuevaTabla: ${err}`)

				else	cumplida(data);

			})
		})


	}

		__prepararAtributos(atributos){

			const AttributeDefinitions = {};
			const KeySchema = {};

			Object.keys(atributos).forEach((a) => {

				AttributeDefinitions[a] = {

					AttributeName: a,
					AttributeType: atributos[a].tipo
				}

				if(!atributos[a].key) return;

				KeySchema[a] = {

					AttributeName: a,
					KeyType: atributos[a].key || "HASH"

				}

			})

			return {
	
				AttributeDefinitions: Object.values(AttributeDefinitions),

				KeySchema: Object.values(KeySchema),

			}
		}

    // clave: objeto o string con la clave
    // tabla: string con el nombre de la tabla
	getItem(clave, tabla){

		const params  = {

			Key: this.__formatearAtributos(clave),

			TableName: tabla

		}

		return new Promise((cumplida, falla) => {

			this.d.getItem(params, (err, data) => {

				if(err) return falla(`DynamoDB:getItem: ${err}`)

				else if(!data.Item) return cumplida(null);

				else	return cumplida(this.__desformatearAtributos(data.Item));
			})

		})
		
	}

    query(q, tabla){

        return new Promise((cumplida, falla) => {

            this.d.query({

                ...q,

                TableName: tabla

            }, (err, data) => {

                if(err) return falla(`DynamoDB:query: ${err}`)
                
                else    return cumplida(data.Items.map((i)=> {

                    return this.__desformatearAtributos(i);

                }));
            })

        })
        
    }

	deleteItem(clave, tabla){

		const params = {

			Key: this.__formatearAtributos(clave),

			TableName: tabla
		}

		return new Promise((cumplida, falla) => {

			this.d.deleteItem(params, (err, data) => {

				if(err) return falla(`DynamoDB:deleteItem: ${err}`)

				cumplida(data);

			})

		})

	}

	putItem(atributos, tabla){

		if(!tabla)
			throw `DynamoDB:putItem: falta 'tabla'`

		const params = {

			Item: this.__formatearAtributos(atributos),

			TableName: tabla

		}

		return new Promise((cumplida, falla) => {

			this.d.putItem(params, (err, data) => {

				if(err) return falla(`DynamoDB:putItem: ${err}`)
			
				else	return cumplida(data);

			})


		})

	}

		__formatearAtributos(atributos = {}){

			const mapa = {};

			Object.keys(atributos).forEach((k) => {

				if(typeof atributos[k] === "string"){

					mapa[k] = {"S" : atributos[k]}
	
				}
				else if(typeof atributos[k] === "number"){
	
					mapa[k] = {"N": atributos[k].toString()}

				}
                else if(Array.isArray(atributos[k])){

                    if(typeof atributos[k][0] === "string")
                        mapa[k] = {"SS": atributos[k]}

                }
				else if(Object(atributos[k]) === atributos[k]){

					mapa[k] = {"M": atributos[k]}

				}
				else if(typeof atributos[k] === "boolean"){
					
					mapa[k] = {"BOOL": atributos[k]}

				}
			})
	
			return mapa;		
		}

		__desformatearAtributos(item){

			const salida = {};

			Object.keys(item).forEach((k) => {

				const v = item[k];

				if(v["N"]){
					salida[k] = Number(v["N"])
				}
				else{
					salida[k] = Object.values(v)[0];
				}

			})
 
			return salida;
		}
}
