module.exports = function(mensaje, contenidos){

	let s = _comparar(mensaje, contenidos);

	//console.log(mensaje);
	//console.log(contenidos)
	//console.log(`REsultado = ${s}`)

	return s;

}

function _comparar(a, b){

	if(Array.isArray(b)) return _compararArrays(a, b);	
	
	switch(typeof b){

		case 'string':
			return _compararLiteral(a, b);
		case 'object':
			return _compararObjetos(a, b);
		case 'number':
			return _compararLiteral(a, b);
		default:
			return _compararLiteral(a, b);
	}

}

function _compararArrays(a, b){

	if(!Array.isArray(a)) return false;

	return true;

}

function _compararObjetos(a, b){

	if(typeof a !== "object") return false;

	let encontrados = true;

	Object.keys(b).forEach(function(k){

		if(!encontrados) return;

		if(a.hasOwnProperty(k)){

			encontrados = _comparar(a[k], b[k]);

		}
		else{
			encontrados = false;
		}

	})

	return encontrados;
}

function _compararLiteral(a, b){

	return a === b;
}
